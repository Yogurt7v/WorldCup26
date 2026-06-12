import { translateTeamName } from './teamNames'

const offset = 0x1F1E6 - 65

function countryFlag(code) {
  return String.fromCodePoint(...code.toUpperCase().split('').map(c => c.charCodeAt(0) + offset))
}

const englandFlag = '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}'
const scotlandFlag = '\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}'

const isoMap = {
  'Алжир': 'DZ',
  'Аргентина': 'AR',
  'Австралия': 'AU',
  'Австрия': 'AT',
  'Бельгия': 'BE',
  'Босния и Герцеговина': 'BA',
  'Бразилия': 'BR',
  'Канада': 'CA',
  'Кабо-Верде': 'CV',
  'Колумбия': 'CO',
  'Хорватия': 'HR',
  'Кюрасао': 'CW',
  'Чехия': 'CZ',
  'ДР Конго': 'CD',
  'Эквадор': 'EC',
  'Египет': 'EG',
  'Франция': 'FR',
  'Германия': 'DE',
  'Гана': 'GH',
  'Гаити': 'HT',
  'Иран': 'IR',
  'Ирак': 'IQ',
  'Кот-д\'Ивуар': 'CI',
  'Япония': 'JP',
  'Иордания': 'JO',
  'Мексика': 'MX',
  'Марокко': 'MA',
  'Нидерланды': 'NL',
  'Новая Зеландия': 'NZ',
  'Норвегия': 'NO',
  'Панама': 'PA',
  'Парагвай': 'PY',
  'Португалия': 'PT',
  'Катар': 'QA',
  'Саудовская Аравия': 'SA',
  'Сенегал': 'SN',
  'ЮАР': 'ZA',
  'Южная Корея': 'KR',
  'Испания': 'ES',
  'Швеция': 'SE',
  'Швейцария': 'CH',
  'Тунис': 'TN',
  'Турция': 'TR',
  'США': 'US',
  'Уругвай': 'UY',
  'Узбекистан': 'UZ',
}

const specialFlags = {
  'Англия': englandFlag,
  'Шотландия': scotlandFlag,
}

export function getFlagForTeam(name) {
  const key = translateTeamName(name)
  if (specialFlags[key]) return specialFlags[key]
  const code = isoMap[key]
  return code ? countryFlag(code) : '🏳️'
}
