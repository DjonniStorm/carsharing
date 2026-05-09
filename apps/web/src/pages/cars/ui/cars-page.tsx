import {
  Alert,
  Container,
  ScrollArea,
  Table,
  Text,
  Title,
} from '@mantine/core'
import { useAction, useAtom } from '@reatom/react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { CarStatus } from '@/entities/car'
import {
  carsListAtom,
  carsListErrorAtom,
  carsListStatusAtom,
  loadCarsList,
} from '@/features/cars/model/cars-list'
import { LANG_KEYS } from '@/shared/i18n/keys'

const CarsPage = () => {
  const { t } = useTranslation()
  const [rows] = useAtom(carsListAtom)
  const [status] = useAtom(carsListStatusAtom)
  const [error] = useAtom(carsListErrorAtom)
  const load = useAction(loadCarsList)

  useEffect(() => {
    void load(false)
  }, [load])

  return (
    <Container size="lg" py="md" px="md">
      <Title order={2}>{t(LANG_KEYS.pages.carsTitle)}</Title>
      {status === 'loading' ? (
        <Text c="dimmed" mt="md">
          {t(LANG_KEYS.pages.carsLoading)}
        </Text>
      ) : error ? (
        <Alert color="red" mt="md" title={t(LANG_KEYS.pages.carsTitle)}>
          {error}
        </Alert>
      ) : (
        <ScrollArea mt="md">
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t(LANG_KEYS.pages.carsColPlate)}</Table.Th>
                <Table.Th>{t(LANG_KEYS.pages.carsColBrand)}</Table.Th>
                <Table.Th>{t(LANG_KEYS.pages.carsColModel)}</Table.Th>
                <Table.Th>{t(LANG_KEYS.pages.carsColStatus)}</Table.Th>
                <Table.Th>{t(LANG_KEYS.pages.carsColFuel)}</Table.Th>
                <Table.Th>{t(LANG_KEYS.pages.carsColPosition)}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(rows ?? []).map((car) => (
                <Table.Tr key={car.id}>
                  <Table.Td>{car.licensePlate}</Table.Td>
                  <Table.Td>{car.brand}</Table.Td>
                  <Table.Td>{car.model}</Table.Td>
                  <Table.Td>{CarStatus[car.carStatus] ?? car.carStatus}</Table.Td>
                  <Table.Td>{car.fuelLevel}</Table.Td>
                  <Table.Td>
                    {car.lastKnownLon != null && car.lastKnownLat != null
                      ? `${car.lastKnownLon.toFixed(4)}, ${car.lastKnownLat.toFixed(4)}`
                      : '—'}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}
    </Container>
  )
}
CarsPage.displayName = 'CarsPage'

export { CarsPage }
