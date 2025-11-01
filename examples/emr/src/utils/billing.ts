// Billing utilities using FHIR ChargeItem and Account resources
import { MedplumClient } from '@medplum/core';
import { ChargeItem, Account, Patient, Encounter, Reference } from '@medplum/fhirtypes';

export interface ChargeItemSummary extends ChargeItem {
  description?: string;
  unitPrice?: number;
  totalPrice?: number;
}

export interface PaymentRecord {
  amount: number;
  method: 'cash' | 'credit-card' | 'debit-card' | 'check' | 'insurance' | 'other';
  date: string;
  notes?: string;
}

export interface BillingSummary {
  totalCharges: number;
  totalPayments: number;
  balance: number;
  charges: ChargeItemSummary[];
  payments: PaymentRecord[];
}

/**
 * Create a charge item for a service
 */
export async function createChargeItem(
  medplum: MedplumClient,
  patientId: string,
  encounterId: string,
  description: string,
  code: string,
  quantity: number,
  unitPrice: number,
  serviceReference?: Reference
): Promise<ChargeItem> {
  const chargeItem: ChargeItem = {
    resourceType: 'ChargeItem',
    status: 'billable',
    code: {
      coding: [{
        system: 'http://example.org/billing-codes',
        code,
        display: description,
      }],
      text: description,
    },
    subject: {
      reference: `Patient/${patientId}`,
    },
    context: {
      reference: `Encounter/${encounterId}`,
    },
    occurrenceDateTime: new Date().toISOString(),
    quantity: {
      value: quantity,
    },
    priceOverride: {
      value: unitPrice,
      currency: 'USD',
    },
    // Store service reference in extension
    extension: serviceReference ? [{
      url: 'http://example.org/fhir/StructureDefinition/service-reference',
      valueReference: serviceReference,
    }] : undefined,
  };

  return medplum.createResource(chargeItem);
}

/**
 * Create charge for medication
 */
export async function createMedicationCharge(
  medplum: MedplumClient,
  patientId: string,
  encounterId: string,
  medicationName: string,
  quantity: number,
  unitPrice: number,
  medicationRequestId?: string
): Promise<ChargeItem> {
  return createChargeItem(
    medplum,
    patientId,
    encounterId,
    `Medication: ${medicationName}`,
    'medication',
    quantity,
    unitPrice,
    medicationRequestId ? { reference: `MedicationRequest/${medicationRequestId}` } : undefined
  );
}

/**
 * Create charge for lab test
 */
export async function createLabCharge(
  medplum: MedplumClient,
  patientId: string,
  encounterId: string,
  testName: string,
  price: number,
  serviceRequestId?: string
): Promise<ChargeItem> {
  return createChargeItem(
    medplum,
    patientId,
    encounterId,
    `Lab Test: ${testName}`,
    'lab-test',
    1,
    price,
    serviceRequestId ? { reference: `ServiceRequest/${serviceRequestId}` } : undefined
  );
}

/**
 * Create charge for imaging test
 */
export async function createImagingCharge(
  medplum: MedplumClient,
  patientId: string,
  encounterId: string,
  testName: string,
  price: number,
  serviceRequestId?: string
): Promise<ChargeItem> {
  return createChargeItem(
    medplum,
    patientId,
    encounterId,
    `Imaging: ${testName}`,
    'imaging',
    1,
    price,
    serviceRequestId ? { reference: `ServiceRequest/${serviceRequestId}` } : undefined
  );
}

/**
 * Create charge for bed/room (daily rate)
 */
export async function createBedCharge(
  medplum: MedplumClient,
  patientId: string,
  encounterId: string,
  bedName: string,
  days: number,
  dailyRate: number,
  locationId?: string
): Promise<ChargeItem> {
  return createChargeItem(
    medplum,
    patientId,
    encounterId,
    `Bed/Room: ${bedName} (${days} day${days > 1 ? 's' : ''})`,
    'bed-room',
    days,
    dailyRate,
    locationId ? { reference: `Location/${locationId}` } : undefined
  );
}

/**
 * Create charge for provider visit
 */
export async function createVisitCharge(
  medplum: MedplumClient,
  patientId: string,
  encounterId: string,
  visitType: string,
  price: number
): Promise<ChargeItem> {
  return createChargeItem(
    medplum,
    patientId,
    encounterId,
    `Visit: ${visitType}`,
    'visit',
    1,
    price,
    { reference: `Encounter/${encounterId}` }
  );
}

/**
 * Get all charges for an encounter
 */
export async function getEncounterCharges(
  medplum: MedplumClient,
  encounterId: string
): Promise<ChargeItemSummary[]> {
  try {
    const result = await medplum.search('ChargeItem', {
      context: `Encounter/${encounterId}`,
      _count: '100',
    });

    return (result.entry?.map(e => {
      const charge = e.resource as ChargeItem;
      const unitPrice = charge.priceOverride?.value || 0;
      const quantity = charge.quantity?.value || 1;
      return {
        ...charge,
        description: charge.code?.text || charge.code?.coding?.[0]?.display,
        unitPrice,
        totalPrice: unitPrice * quantity,
      };
    }) || []);
  } catch (error) {
    console.error('Failed to fetch charges:', error);
    return [];
  }
}

/**
 * Get all charges for a patient
 */
export async function getPatientCharges(
  medplum: MedplumClient,
  patientId: string
): Promise<ChargeItemSummary[]> {
  try {
    const result = await medplum.search('ChargeItem', {
      subject: `Patient/${patientId}`,
      _count: '200',
    });

    return (result.entry?.map(e => {
      const charge = e.resource as ChargeItem;
      const unitPrice = charge.priceOverride?.value || 0;
      const quantity = charge.quantity?.value || 1;
      return {
        ...charge,
        description: charge.code?.text || charge.code?.coding?.[0]?.display,
        unitPrice,
        totalPrice: unitPrice * quantity,
      };
    }) || []);
  } catch (error) {
    console.error('Failed to fetch charges:', error);
    return [];
  }
}

/**
 * Record a payment
 */
export async function recordPayment(
  medplum: MedplumClient,
  patientId: string,
  encounterId: string | undefined,
  payment: PaymentRecord
): Promise<Account> {
  // Get or create account for patient
  let account = await getOrCreatePatientAccount(medplum, patientId);

  // Add payment to account extension
  const payments = account.extension?.filter(
    ext => ext.url === 'http://example.org/fhir/StructureDefinition/payment'
  ) || [];

  payments.push({
    url: 'http://example.org/fhir/StructureDefinition/payment',
    extension: [
      {
        url: 'amount',
        valueMoney: {
          value: payment.amount,
          currency: 'USD',
        },
      },
      {
        url: 'method',
        valueString: payment.method,
      },
      {
        url: 'date',
        valueDateTime: payment.date,
      },
      {
        url: 'encounter',
        valueReference: encounterId ? { reference: `Encounter/${encounterId}` } : undefined,
      },
      {
        url: 'notes',
        valueString: payment.notes,
      },
    ].filter(e => e.valueString !== undefined || e.valueMoney !== undefined || e.valueDateTime !== undefined || e.valueReference !== undefined),
  });

  account.extension = [
    ...account.extension?.filter(
      ext => ext.url !== 'http://example.org/fhir/StructureDefinition/payment'
    ) || [],
    ...payments,
  ];

  return medplum.updateResource(account);
}

/**
 * Get or create account for patient
 */
async function getOrCreatePatientAccount(
  medplum: MedplumClient,
  patientId: string
): Promise<Account> {
  try {
    const result = await medplum.search('Account', {
      subject: `Patient/${patientId}`,
      _count: '1',
    });

    if (result.entry && result.entry.length > 0) {
      return result.entry[0].resource as Account;
    }
  } catch (error) {
    // Account doesn't exist, create it
  }

  // Create new account
  const account: Account = {
    resourceType: 'Account',
    status: 'active',
    subject: [{
      reference: `Patient/${patientId}`,
    }],
    name: `Account for Patient ${patientId}`,
  };

  return medplum.createResource(account);
}

/**
 * Get billing summary for an encounter
 */
export async function getEncounterBillingSummary(
  medplum: MedplumClient,
  encounterId: string,
  patientId: string
): Promise<BillingSummary> {
  const charges = await getEncounterCharges(medplum, encounterId);
  const account = await getOrCreatePatientAccount(medplum, patientId);

  // Extract payments for this encounter
  const payments: PaymentRecord[] = [];
  const paymentExtensions = account.extension?.filter(
    ext => ext.url === 'http://example.org/fhir/StructureDefinition/payment'
  ) || [];

  for (const paymentExt of paymentExtensions) {
    const encounterRef = paymentExt.extension?.find(e => e.url === 'encounter')?.valueReference;
    if (encounterRef?.reference === `Encounter/${encounterId}`) {
      const amount = paymentExt.extension?.find(e => e.url === 'amount')?.valueMoney?.value || 0;
      const method = paymentExt.extension?.find(e => e.url === 'method')?.valueString as PaymentRecord['method'] || 'cash';
      const date = paymentExt.extension?.find(e => e.url === 'date')?.valueDateTime || new Date().toISOString();
      const notes = paymentExt.extension?.find(e => e.url === 'notes')?.valueString;

      payments.push({ amount, method, date, notes });
    }
  }

  const totalCharges = charges.reduce((sum, charge) => sum + (charge.totalPrice || 0), 0);
  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return {
    totalCharges,
    totalPayments,
    balance: totalCharges - totalPayments,
    charges,
    payments,
  };
}

/**
 * Get billing summary for a patient (all encounters)
 */
export async function getPatientBillingSummary(
  medplum: MedplumClient,
  patientId: string
): Promise<BillingSummary> {
  const charges = await getPatientCharges(medplum, patientId);
  const account = await getOrCreatePatientAccount(medplum, patientId);

  // Extract all payments
  const payments: PaymentRecord[] = [];
  const paymentExtensions = account.extension?.filter(
    ext => ext.url === 'http://example.org/fhir/StructureDefinition/payment'
  ) || [];

  for (const paymentExt of paymentExtensions) {
    const amount = paymentExt.extension?.find(e => e.url === 'amount')?.valueMoney?.value || 0;
    const method = paymentExt.extension?.find(e => e.url === 'method')?.valueString as PaymentRecord['method'] || 'cash';
    const date = paymentExt.extension?.find(e => e.url === 'date')?.valueDateTime || new Date().toISOString();
    const notes = paymentExt.extension?.find(e => e.url === 'notes')?.valueString;

    payments.push({ amount, method, date, notes });
  }

  const totalCharges = charges.reduce((sum, charge) => sum + (charge.totalPrice || 0), 0);
  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return {
    totalCharges,
    totalPayments,
    balance: totalCharges - totalPayments,
    charges,
    payments,
  };
}

/**
 * Get pricing from resource extensions
 */
export function getPriceFromResource(resource: any): number | undefined {
  const priceExt = resource.extension?.find(
    (ext: any) => ext.url === 'http://example.org/fhir/StructureDefinition/price'
  );
  return priceExt?.valueMoney?.value;
}

/**
 * Set pricing on a resource
 */
export function setPriceOnResource(resource: any, price: number): any {
  const otherExtensions = resource.extension?.filter(
    (ext: any) => ext.url !== 'http://example.org/fhir/StructureDefinition/price'
  ) || [];

  return {
    ...resource,
    extension: [
      ...otherExtensions,
      {
        url: 'http://example.org/fhir/StructureDefinition/price',
        valueMoney: {
          value: price,
          currency: 'USD',
        },
      },
    ],
  };
}

