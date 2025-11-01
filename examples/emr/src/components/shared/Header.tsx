import { useState, useEffect, JSX } from 'react';
import { Menu, Group, Autocomplete, Button, Text, ActionIcon, Image } from '@mantine/core';
import { IconSearch, IconUserPlus, IconUsers, IconUser, IconLogout, IconShieldCheck, IconSettings, IconFileText, IconCalendar, IconCalendarTime, IconCalendarStats, IconFlask, IconPhoto, IconBuilding, IconStethoscope, IconPill, IconPackage, IconBuildingHospital, IconBed, IconCash } from '@tabler/icons-react';
import { useMedplum } from '@medplum/react';
import { Patient } from '@medplum/fhirtypes';
import { useNavigate } from 'react-router';
import { NewProviderModal } from '../admin/NewProviderModal';
import { isUserAdmin } from '../../utils/permissions';
import { getEMRSettings } from '../../utils/settings';
import { LanguageSelector } from './LanguageSelector';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  onPatientSelect: (patient: Patient) => void;
}

export function Header({ onPatientSelect }: HeaderProps): JSX.Element {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<{ value: string; resource: Patient }[]>([]);
  const [newProviderModalOpen, setNewProviderModalOpen] = useState(false);
  const [emrName, setEmrName] = useState('Medplum EMR');
  const [emrLogo, setEmrLogo] = useState<string | null>(null);
  const medplum = useMedplum();
  const navigate = useNavigate();
  const profile = medplum.getProfile();
  const isAdmin = isUserAdmin(profile);
  const { t } = useTranslation();

  // Load EMR settings on mount and when settings change
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getEMRSettings(medplum);
      if (settings) {
        setEmrName(settings.name || 'Medplum EMR');
        setEmrLogo(settings.logo || null);
      }
    };
    loadSettings();

    // Listen for settings changes
    const handleSettingsChange = () => {
      loadSettings();
    };
    window.addEventListener('emr-settings-changed', handleSettingsChange);

    // Cleanup
    return () => {
      window.removeEventListener('emr-settings-changed', handleSettingsChange);
    };
  }, [medplum]);

  const handleSearch = async (query: string): Promise<void> => {
    setSearch(query);
    if (query.length < 2) {
      setResults([]);
      return;
    }
    
    try {
      // Search for patients using standard FHIR search parameters
      const res = await medplum.search('Patient', {
        name: query,
        _sort: '-_lastUpdated',
        _count: 10
      });
      
      const mappedResults = res.entry?.map(e => ({
        value:
          e.resource?.name?.[0]?.text ||
          [
            e.resource?.name?.[0]?.given?.[0],
            e.resource?.name?.[0]?.family
          ].filter(Boolean).join(' ') ||
          e.resource?.id || '',
        resource: e.resource as Patient
      })) || [];
      
      setResults(mappedResults);
    } catch (error) {
      setResults([]);
    }
  };

  const handleSelect = (value: string): void => {
    const found = results.find(r => r.value === value);
    if (found) {
      setSearch('');
      setResults([]);
      onPatientSelect(found.resource);
      navigate(`/patient/${found.resource.id}`);
    }
  };

  const userName = profile?.resourceType === 'Practitioner' 
    ? profile.name?.[0]?.text || profile.name?.[0]?.family || 'User'
    : 'User';

  return (
    <>
      <NewProviderModal opened={newProviderModalOpen} onClose={() => setNewProviderModalOpen(false)} />
      
      <Group justify="space-between" p="md" style={{ borderBottom: '1px solid #eee', background: '#fff' }}>
        {/* Left side - Logo */}
        <Group gap="md" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          {emrLogo && emrLogo.length > 0 ? (
            <Image 
              src={emrLogo} 
              alt="EMR Logo"
              h={40}
              w="auto"
              fit="contain"
            />
          ) : (
            <ActionIcon 
              variant="subtle" 
              size="lg"
            >
              <Text size="xl" fw={700} c="blue">M</Text>
            </ActionIcon>
          )}
          <Text 
            size="lg" 
            fw={700} 
            c="blue"
          >
            {emrName}
          </Text>
        </Group>

        {/* Center/Right - Search and Actions */}
        <Group gap="md">
          <Autocomplete
            leftSection={<IconSearch size={16} />}
            placeholder={t('header.searchPlaceholder')}
            value={search}
            onChange={handleSearch}
            data={results.map(r => r.value)}
            onOptionSubmit={handleSelect}
            style={{ minWidth: 350 }}
          />

          {/* Scheduling Menu */}
          <Menu>
            <Menu.Target>
              <Button 
                variant="light" 
                leftSection={<IconCalendar size={16} />}
                color="grape"
              >
                {t('header.scheduling')}
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>{t('header.appointments')}</Menu.Label>
              <Menu.Item
                leftSection={<IconCalendarTime size={16} />}
                onClick={() => navigate('/scheduling/book')}
              >
                {t('header.bookAppointment')}
              </Menu.Item>
              <Menu.Item
                leftSection={<IconCalendarStats size={16} />}
                onClick={() => navigate('/scheduling/calendar')}
              >
                {t('header.providerCalendar')}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconCalendar size={16} />}
                onClick={() => navigate('/scheduling/manage')}
              >
                {t('header.manageSchedules')}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          {/* Billing Menu */}
          <Button 
            variant="light" 
            leftSection={<IconCash size={16} />}
            color="teal"
            onClick={() => navigate('/billing')}
          >
            {t('billing.billing')}
          </Button>

          {/* Admin Menu - Only shown for admins */}
          {isAdmin && (
            <Menu>
              <Menu.Target>
                <Button 
                  variant="light" 
                  leftSection={<IconShieldCheck size={16} />}
                  color="blue"
                >
                  {t('header.admin')}
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>{t('header.administration')}</Menu.Label>
                <Menu.Item
                  leftSection={<IconUserPlus size={16} />}
                  onClick={() => setNewProviderModalOpen(true)}
                >
                  {t('header.addUserProvider')}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconUsers size={16} />}
                  onClick={() => navigate('/admin/users')}
                >
                  {t('header.manageUsers')}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Label>{t('header.configuration')}</Menu.Label>
                <Menu.Item
                  leftSection={<IconFileText size={16} />}
                  onClick={() => navigate('/admin/note-templates')}
                >
                  {t('header.noteTemplates')}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconCalendar size={16} />}
                  onClick={() => navigate('/admin/appointment-types')}
                >
                  {t('header.appointmentTypes')}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconStethoscope size={16} />}
                  onClick={() => navigate('/admin/diagnosis-codes')}
                >
                  {t('header.diagnosisCodes')}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconPill size={16} />}
                  onClick={() => navigate('/admin/medications')}
                >
                  {t('header.medicationCatalog')}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconPackage size={16} />}
                  onClick={() => navigate('/admin/inventory')}
                >
                  {t('header.inventory')}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Label>{t('header.bedManagement')}</Menu.Label>
                <Menu.Item
                  leftSection={<IconBuildingHospital size={16} />}
                  onClick={() => navigate('/admin/departments')}
                >
                  {t('header.departments')}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconBed size={16} />}
                  onClick={() => navigate('/admin/beds')}
                >
                  {t('header.beds')}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Label>{t('header.diagnosticServices')}</Menu.Label>
                <Menu.Item
                  leftSection={<IconFlask size={16} />}
                  onClick={() => navigate('/admin/lab-tests')}
                >
                  {t('header.labTestsCatalog')}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconPhoto size={16} />}
                  onClick={() => navigate('/admin/imaging-tests')}
                >
                  {t('header.imagingTestsCatalog')}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconBuilding size={16} />}
                  onClick={() => navigate('/admin/diagnostic-providers')}
                >
                  {t('header.diagnosticProviders')}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconSettings size={16} />}
                  onClick={() => navigate('/admin/settings')}
                >
                  {t('header.settings')}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}

          {/* User Profile Menu */}
          {profile ? (
            <Menu>
              <Menu.Target>
                <Button 
                  variant="subtle"
                  leftSection={<IconUser size={16} />}
                >
                  {userName}
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>{t('header.account')}</Menu.Label>
                <Menu.Item
                  leftSection={<IconUser size={16} />}
                  onClick={() => navigate('/profile')}
                >
                  {t('header.profile')}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconLogout size={16} />}
                  onClick={() => medplum.signOut().then(() => navigate('/signin'))}
                  color="red"
                >
                  {t('header.signOut')}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : (
            <Button
              variant="light"
              leftSection={<IconUser size={16} />}
              onClick={() => navigate('/signin')}
            >
              {t('header.signIn')}
            </Button>
          )}
        </Group>

        <div style={{ marginLeft: 'auto' }}>
          <LanguageSelector />
        </div>
      </Group>
    </>
  );
}
