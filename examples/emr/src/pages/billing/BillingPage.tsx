import { Paper, Title, Stack, Group, Button, Select, Table, Text, Badge, Autocomplete } from '@mantine/core';
import { Document, useMedplum } from '@medplum/react';
import { Patient, Encounter } from '@medplum/fhirtypes';
import { IconCash, IconSearch, IconPlus } from '@tabler/icons-react';
import { JSX, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '@medplum/core';
import { getPatientBillingSummary, getEncounterBillingSummary, ChargeItemSummary, PaymentRecord } from '../../utils/billing';
import { BreadcrumbNav } from '../../components/shared/BreadcrumbNav';
import { handleError } from '../../utils/errorHandling';
import { PaymentModal } from '../../components/billing/PaymentModal';

export function BillingPage(): JSX.Element {
  const { t } = useTranslation();
  const medplum = useMedplum();
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientOptions, setPatientOptions] = useState<{ value: string; label: string; patient: Patient }[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [charges, setCharges] = useState<ChargeItemSummary[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [totalCharges, setTotalCharges] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
  const [balance, setBalance] = useState(0);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Search for patients
  const handlePatientSearch = async (query: string): Promise<void> => {
    setPatientSearch(query);
    if (query.length < 2) {
      setPatientOptions([]);
      return;
    }

    try {
      const result = await medplum.search('Patient', {
        name: query,
        _count: '10',
      });

      const options = result.entry?.map(e => {
        const patient = e.resource as Patient;
        const name = patient.name?.[0]?.text ||
          [patient.name?.[0]?.given?.[0], patient.name?.[0]?.family].filter(Boolean).join(' ') ||
          'Unknown';
        return {
          value: patient.id || '',
          label: `${name} (${patient.id})`,
          patient,
        };
      }) || [];

      setPatientOptions(options);
    } catch (error) {
      handleError(error, 'searching patients');
    }
  };

  // Load encounters when patient is selected
  useEffect(() => {
    if (selectedPatient?.id) {
      loadEncounters(selectedPatient.id);
      loadPatientBilling(selectedPatient.id);
    } else {
      setEncounters([]);
      setSelectedEncounter(null);
      clearBillingData();
    }
  }, [selectedPatient]);

  // Load billing when encounter is selected
  useEffect(() => {
    if (selectedEncounter?.id && selectedPatient?.id) {
      loadEncounterBilling(selectedEncounter.id, selectedPatient.id);
    } else if (selectedPatient?.id && !selectedEncounter) {
      loadPatientBilling(selectedPatient.id);
    }
  }, [selectedEncounter]);

  const loadEncounters = async (patientId: string): Promise<void> => {
    try {
      const result = await medplum.search('Encounter', {
        subject: `Patient/${patientId}`,
        _count: '50',
        _sort: '-date',
      });
      setEncounters(result.entry?.map(e => e.resource as Encounter) || []);
    } catch (error) {
      handleError(error, 'loading encounters');
    }
  };

  const loadPatientBilling = async (patientId: string): Promise<void> => {
    setLoading(true);
    try {
      const summary = await getPatientBillingSummary(medplum, patientId);
      setCharges(summary.charges);
      setPayments(summary.payments);
      setTotalCharges(summary.totalCharges);
      setTotalPayments(summary.totalPayments);
      setBalance(summary.balance);
    } catch (error) {
      handleError(error, 'loading patient billing');
    } finally {
      setLoading(false);
    }
  };

  const loadEncounterBilling = async (encounterId: string, patientId: string): Promise<void> => {
    setLoading(true);
    try {
      const summary = await getEncounterBillingSummary(medplum, encounterId, patientId);
      setCharges(summary.charges);
      setPayments(summary.payments);
      setTotalCharges(summary.totalCharges);
      setTotalPayments(summary.totalPayments);
      setBalance(summary.balance);
    } catch (error) {
      handleError(error, 'loading encounter billing');
    } finally {
      setLoading(false);
    }
  };

  const clearBillingData = (): void => {
    setCharges([]);
    setPayments([]);
    setTotalCharges(0);
    setTotalPayments(0);
    setBalance(0);
  };

  const handlePatientSelect = (value: string): void => {
    const option = patientOptions.find(o => o.value === value);
    if (option) {
      setSelectedPatient(option.patient);
      setSelectedEncounter(null);
    }
  };

  const handleEncounterSelect = (value: string | null): void => {
    if (value === 'all') {
      setSelectedEncounter(null);
      if (selectedPatient?.id) {
        loadPatientBilling(selectedPatient.id);
      }
    } else if (value) {
      const encounter = encounters.find(e => e.id === value);
      if (encounter) {
        setSelectedEncounter(encounter);
      }
    }
  };

  const getStatusColor = (balance: number): string => {
    if (balance === 0) return 'green';
    if (balance > 0) return totalPayments > 0 ? 'yellow' : 'red';
    return 'gray';
  };

  const getStatusLabel = (balance: number): string => {
    if (balance === 0) return t('billing.paid');
    if (balance > 0) return totalPayments > 0 ? t('billing.partiallyPaid') : t('billing.unpaid');
    return '';
  };

  const encounterOptions = [
    { value: 'all', label: t('common.all') },
    ...encounters.map(enc => ({
      value: enc.id || '',
      label: `${enc.type?.[0]?.text || enc.class?.display || 'Encounter'} - ${enc.period?.start ? formatDateTime(enc.period.start) : ''}`,
    })),
  ];

  return (
    <Document>
      <BreadcrumbNav />
      
      <PaymentModal
        opened={paymentModalOpen}
        onClose={(saved) => {
          setPaymentModalOpen(false);
          if (saved && selectedPatient?.id) {
            if (selectedEncounter?.id) {
              loadEncounterBilling(selectedEncounter.id, selectedPatient.id);
            } else {
              loadPatientBilling(selectedPatient.id);
            }
          }
        }}
        patientId={selectedPatient?.id}
        encounterId={selectedEncounter?.id}
      />

      <Paper shadow="sm" p="lg" withBorder style={{ marginTop: 0 }}>
        <Group justify="space-between" mb="lg">
          <Title order={2}>
            <Group gap="xs">
              <IconCash size={28} />
              {t('billing.billing')}
            </Group>
          </Title>
        </Group>

        {/* Search Section */}
        <Stack gap="md" mb="xl">
          <Group grow>
            <Autocomplete
              label={t('billing.searchPatient')}
              placeholder={t('billing.searchPatient')}
              data={patientOptions}
              value={patientSearch}
              onChange={handlePatientSearch}
              onOptionSubmit={handlePatientSelect}
              leftSection={<IconSearch size={16} />}
            />
            {selectedPatient && encounters.length > 0 && (
              <Select
                label={t('billing.selectEncounter')}
                placeholder={t('billing.selectEncounter')}
                data={encounterOptions}
                value={selectedEncounter?.id || 'all'}
                onChange={handleEncounterSelect}
              />
            )}
          </Group>
        </Stack>

        {selectedPatient && (
          <>
            {/* Summary Section */}
            <Paper p="md" withBorder mb="md" bg="gray.0">
              <Group justify="space-between">
                <div>
                  <Text size="sm" c="dimmed">{t('billing.totalCharges')}</Text>
                  <Text size="xl" fw={700}>${totalCharges.toFixed(2)}</Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">{t('billing.totalPayments')}</Text>
                  <Text size="xl" fw={700} c="green">${totalPayments.toFixed(2)}</Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">{t('billing.outstandingBalance')}</Text>
                  <Group gap="xs">
                    <Text size="xl" fw={700} c={balance > 0 ? 'red' : 'green'}>
                      ${balance.toFixed(2)}
                    </Text>
                    <Badge color={getStatusColor(balance)}>
                      {getStatusLabel(balance)}
                    </Badge>
                  </Group>
                </div>
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={() => setPaymentModalOpen(true)}
                  disabled={!selectedPatient}
                >
                  {t('billing.addPayment')}
                </Button>
              </Group>
            </Paper>

            {/* Charges Table */}
            <Title order={4} mb="md">{t('billing.charges')}</Title>
            {charges.length === 0 ? (
              <Paper p="xl" withBorder bg="gray.0" mb="md">
                <Text ta="center" c="dimmed">{t('billing.noCharges')}</Text>
              </Paper>
            ) : (
              <Table striped highlightOnHover mb="md">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('billing.serviceDescription')}</Table.Th>
                    <Table.Th>{t('billing.serviceDate')}</Table.Th>
                    <Table.Th>{t('billing.quantity')}</Table.Th>
                    <Table.Th>{t('billing.pricePerUnit')}</Table.Th>
                    <Table.Th>{t('billing.total')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {charges.map((charge) => (
                    <Table.Tr key={charge.id}>
                      <Table.Td>{charge.description || charge.code?.text}</Table.Td>
                      <Table.Td>
                        {charge.occurrenceDateTime ? formatDateTime(charge.occurrenceDateTime) : '-'}
                      </Table.Td>
                      <Table.Td>{charge.quantity?.value || 1}</Table.Td>
                      <Table.Td>${(charge.unitPrice || 0).toFixed(2)}</Table.Td>
                      <Table.Td>
                        <Text fw={500}>${(charge.totalPrice || 0).toFixed(2)}</Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}

            {/* Payments Table */}
            {payments.length > 0 && (
              <>
                <Title order={4} mb="md">{t('billing.payments')}</Title>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{t('billing.paymentDate')}</Table.Th>
                      <Table.Th>{t('billing.amount')}</Table.Th>
                      <Table.Th>{t('billing.paymentMethod')}</Table.Th>
                      <Table.Th>{t('billing.paymentNotes')}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {payments.map((payment, index) => (
                      <Table.Tr key={index}>
                        <Table.Td>{formatDateTime(payment.date)}</Table.Td>
                        <Table.Td>
                          <Text fw={500} c="green">${payment.amount.toFixed(2)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge>{t(`billing.method.${payment.method}`)}</Badge>
                        </Table.Td>
                        <Table.Td>{payment.notes || '-'}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </>
            )}
          </>
        )}

        {!selectedPatient && (
          <Paper p="xl" withBorder bg="gray.0">
            <Text ta="center" c="dimmed" size="lg">
              {t('billing.searchPatient')}
            </Text>
          </Paper>
        )}
      </Paper>
    </Document>
  );
}

