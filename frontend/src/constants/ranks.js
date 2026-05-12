import { GiAngelOutfit, GiCrossedSwords, GiDelighted, GiPrayer, GiShurikenAperture, GiShuriken, GiSamuraiHelmet } from 'react-icons/gi'
import { PiStudent } from 'react-icons/pi'

export const RANK_META = {
  Student: { label: 'Student', Icon: PiStudent },
  Chunin: { label: 'Chunin', Icon: GiShuriken },
  Ninja: { label: 'Ninja', Icon: GiShurikenAperture },
  Samurai: { label: 'Samurai', Icon: GiSamuraiHelmet },
  Ronin: { label: 'Ronin', Icon: GiCrossedSwords },
  Monk: { label: 'Monk', Icon: GiPrayer },
  Delighted: { label: 'Delighted', Icon: GiDelighted },
  Archangel: { label: 'Archangel', Icon: GiAngelOutfit }
}

export const DEFAULT_RANK = 'Student'
