import { waitForEvenAppBridge } from '@evenrealities/even_hub_sdk'

const nameForm   = document.getElementById('nameForm')   as HTMLDivElement
const nameInput  = document.getElementById('nameInput')  as HTMLInputElement
const nameSubmit = document.getElementById('nameSubmit') as HTMLButtonElement
const statsPanel = document.getElementById('statsPanel') as HTMLDivElement

nameInput.addEventListener('input', () => { nameSubmit.disabled = nameInput.value.trim().length < 1 })
nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !nameSubmit.disabled) confirmName() })
nameSubmit.addEventListener('click', confirmName)

function confirmName() {
  const val = nameInput.value.trim()
  if (!val) return
  charName = val.slice(0, 12)
  hideNameForm()
  confirmCharacter()
}
function showNameForm() {
  nameForm.style.display = 'flex'
  nameInput.value = ''
  nameSubmit.disabled = true
  setTimeout(() => nameInput.focus(), 100)
}
function hideNameForm() { nameForm.style.display = 'none' }
function setStatus(msg: string) { const el = document.getElementById('app'); if (el) el.innerText = msg }
function setText(id: string, val: string) { const el = document.getElementById(id); if (el) el.textContent = val }

function updatePhoneStats() {
  statsPanel.style.display = 'flex'
  const passiveDesc: Record<number, string> = {
    0: 'Balanced - no passive',
    1: 'Tank - +2 starting HP',
    2: 'Defender - +15% dodge',
    3: 'Attacker - +1 starting ATK',
    4: 'Lucky - 20% double damage',
    5: 'Cleric - heals 1 HP below half',
  }
  setText('st-hero',   charName || 'Enter name...')
  setText('st-class',  SHAPES[shapeIndex] + ' ' + SHAPE_NAMES[shapeIndex])
  setText('st-hp',     playerHP > 0 ? '♥'.repeat(playerHP) + ' (' + playerHP + ')' : '-')
  setText('st-maxhp',  String(maxPlayerHP))
  setText('st-atk',    '+' + attackBonus + (tempAtkBonus > 0 ? ' (+' + tempAtkBonus + ' tmp)' : ''))
  setText('st-gold',   String(playerGold) + 'g')
  setText('st-fights', String(fightsWon) + ' wins')
  const questLabels: Record<number, string> = {
    0:'Find Bram',    1:'Enter Cave',    2:'Return Bram',
    3:'Find Greta',   4:'Enter Ruins',   5:'Return Greta',
    6:'Find Aria',    7:'Spider Den',    8:'Return Aria',
    9:'Find Gareth',  10:'Wolf Clear',   11:'Ret. Gareth',
    12:'Find Thorin', 13:'Troll Bridge', 14:'Ret. Thorin',
    15:'Find Lyra',   16:'Banshee',      17:'Ret. Lyra',
    18:'Find Dorin',  19:'Vampire',      20:'Ret. Dorin',
    21:'Find Mira',   22:'Bog Wraith',   23:'Ret. Mira',
    24:'Find Mira',   25:'Hydra',        26:'Ret. Mira',
    27:'Find Zane',   28:'Death Knight', 29:'Ret. Zane',
    30:'Find Rook',   31:'Gargoyle',     32:'Ret. Rook',
    33:'Find Rook',   34:'Necromancer',  35:'Ret. Rook',
    36:'Find Vera',   37:'Knight',       38:'Ret. Vera',
    39:'Find Vera',   40:'Gargoyle II',  41:'Ret. Vera',
    42:'Find Vera',   43:'Necro II',     44:'Ret. Vera',
    45:'Find Moss',   46:'Knight II',    47:'Ret. Moss',
    48:'Find Moss',   49:'Dragon Young', 50:'Ret. Moss',
    51:'Find Moss',   52:'Dragon',       53:'Ret. Moss',
    54:'Find Thane',  55:'Dragon Elder', 56:'Ret. Thane',
    57:'Find Thane',  58:'Dragon King',  59:'Ret. Thane',
    60:'BOSS FIGHT!', 61:'★ LEGEND ★',
  }
  setText('st-quest', questLabels[questPhase] || '-')
  const titles: string[] = []
  if (questPhase >= 3)  titles.push('Slime-Slayer')
  if (questPhase >= 6)  titles.push('Bone-Breaker')
  if (questPhase >= 9)  titles.push('Spider-Slayer')
  if (questPhase >= 12) titles.push('Wolf-Bane')
  if (questPhase >= 15) titles.push('Troll-Crusher')
  if (questPhase >= 18) titles.push('Banshee-Silencer')
  if (questPhase >= 21) titles.push('Vampire-Slayer')
  if (questPhase >= 24) titles.push('Wraith-Walker')
  if (questPhase >= 27) titles.push('Hydra-Breaker')
  if (questPhase >= 30) titles.push('Knight-Crusher')
  if (questPhase >= 33) titles.push('Stone-Smasher')
  if (questPhase >= 36) titles.push('Necro-Breaker')
  if (questPhase >= 39) titles.push('Knight-Slayer')
  if (questPhase >= 42) titles.push('Gargoyle-Crusher')
  if (questPhase >= 45) titles.push('Necro-Master')
  if (questPhase >= 48) titles.push('Knight-Master')
  if (questPhase >= 51) titles.push('Dragon-Tamer')
  if (questPhase >= 54) titles.push('Dragon-Slayer')
  if (questPhase >= 57) titles.push('Dragon-Elder')
  if (questPhase >= 60) titles.push('Dragon-King')
  if (questPhase >= 61) titles.push('Shadow-Slayer')
  setText('st-titles', titles.length > 0 ? titles.join(', ') : 'None yet')
  const items: string[] = []
  if (hasSword)        items.push('Sword')
  if (hasShield)       items.push('Shield')
  if (hasBow)          items.push('Bow')
  if (hasPouch)        items.push('H.Pouch')
  if (hasMagicStaff)   items.push('MagicStaff')
  if (hasDragonShield) items.push('DrgnShield')
  if (hasEnchantedBow) items.push('Ench.Bow')
  if (hasHealingRing)  items.push('HealRing')
  if (hasSoulStone)    items.push('SoulStone')
  if (hasCursedBlade)  items.push('CursedBlade')
  const extras: string[] = []
  if (potionCount > 0)  extras.push('Potion x' + potionCount + '/' + getPotionMax())
  if (tempAtkBonus > 0) extras.push('OldSword(tmp)')
  if (tempLucky)        extras.push('LuckyCharm(tmp)')
  setText('st-inv', 'INV: ' + (items.length > 0 ? items.join(', ') : 'empty') +
    (extras.length > 0 ? ' | ' + extras.join(', ') : ''))
  setText('st-passive', passiveDesc[shapeIndex] || '')
}

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

type Screen =
  | 'title' | 'charSelect' | 'upgrade' | 'help'
  | 'explore' | 'forestExplore' | 'swampExplore' | 'dungeonExplore'
  | 'merchant' | 'merchantMsg'
  | 'swampShop' | 'swampShopMsg'
  | 'dungeonShop' | 'dungeonShopMsg'
  | 'foundItem' | 'secretUpgrade'
  | 'bram1' | 'bram2' | 'bramAccepted' | 'bramReward' | 'title1Earned'
  | 'greta1' | 'greta2' | 'gretaAccepted' | 'gretaReward' | 'title2Earned'
  | 'aria1' | 'aria2' | 'ariaAccepted' | 'ariaReward' | 'title3Earned'
  | 'gareth1' | 'gareth2' | 'garethAccepted' | 'garethReward' | 'title4Earned'
  | 'thorin1' | 'thorin2' | 'thorinAccepted' | 'thorinReward' | 'title5Earned'
  | 'lyra1' | 'lyra2' | 'lyraAccepted' | 'lyraReward' | 'title6Earned'
  | 'dorin1' | 'dorin2' | 'dorinAccepted' | 'dorinReward' | 'title7Earned'
  | 'mira1' | 'mira2' | 'miraAccepted' | 'miraReward' | 'title8Earned'
  | 'mira3' | 'mira4' | 'mira2Accepted' | 'mira2Reward' | 'title9Earned'
  | 'zane1' | 'zane2' | 'zaneAccepted' | 'zaneReward' | 'title10Earned'
  | 'rook1' | 'rook2' | 'rookAccepted' | 'rookReward' | 'title11Earned'
  | 'rook3' | 'rook4' | 'rook2Accepted' | 'rook2Reward' | 'title12Earned'
  | 'vera1' | 'vera2' | 'veraAccepted' | 'veraReward' | 'title13Earned'
  | 'vera3' | 'vera4' | 'vera2Accepted' | 'vera2Reward' | 'title14Earned'
  | 'vera5' | 'vera6' | 'vera3Accepted' | 'vera3Reward' | 'title15Earned'
  | 'moss1' | 'moss2' | 'mossAccepted' | 'mossReward' | 'title16Earned'
  | 'moss3' | 'moss4' | 'moss2Accepted' | 'moss2Reward' | 'title17Earned'
  | 'moss5' | 'moss6' | 'moss3Accepted' | 'moss3Reward' | 'title18Earned'
  | 'thane1' | 'thane2' | 'thaneAccepted' | 'thaneReward' | 'title19Earned'
  | 'thane3' | 'thane4' | 'thane2Accepted' | 'thane2Reward' | 'title20Earned'
  | 'trollGreet' | 'bossGreet' | 'bossVictory' | 'bossReward'
  | 'combat' | 'combatMenu' | 'fleeConfirm'
  | 'playerHit' | 'playerMiss'
  | 'playerDefend' | 'playerDefendFail'
  | 'playerPower' | 'playerPowerMiss'
  | 'enemyAttack' | 'victory' | 'dead'

// ═══════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════

let currentScreen: Screen = 'title'
let bridge: any = null
let pageCreated = false
let lastBuiltIsExplore = false

let questPhase = 0
let maxPlayerHP = 5
let playerHP = 5
let attackBonus = 0
let playerGold = 0
let potionCount = 0
let fightsWon = 0
let tempAtkBonus = 0
let tempLucky = false
let powerUsed = false
let enemyCurrentHP = 0
let isDefending = false
let defendSucceeded = false
let lastPlayerAttack = ''
let lastEnemyAttack = ''
let merchantMessage = ''
let merchantItemIndex = 0
let swampShopMessage = ''
let dungeonShopMessage = ''
let dotCollectedThisMove = false
let foundItemMessage = ''
let returnScreenAfterFind: Screen = 'explore'
let secretFound = false

let dot1Collected = false
let dot2Collected = false
let dot3Collected = false
let dot4Collected = false
let dot5Collected = false
let dot6Collected = false
let dot7Collected = false
let dot8Collected = false

let poisoned = false
let trollCharging = false
let bansheeStunned = false
let hydraRegrown = false
let necroRevived = false
let gargoyleStoned = false
let isBossFight = false
let bossShielded = false

let hasSword        = false
let hasShield       = false
let hasBow          = false
let hasPouch        = false
let hasMagicStaff   = false
let hasDragonShield = false
let hasEnchantedBow = false
let hasHealingRing  = false
let hasSoulStone    = false
let hasCursedBlade  = false

const SHAPES      = ['▲', '●', '■', '★', '◆', '+']
const SHAPE_NAMES = ['Triangle','Circle','Square','Star','Diamond','Cross']
let shapeIndex = 0
let charShape = '▲'
let charName = 'Wanderer'

const SHOP_ITEMS = [
  { key: 'potion',  name: 'Potion',     price: 15, desc: '+2 HP in combat'   },
  { key: 'sword',   name: 'Sword',      price: 20, desc: '+1 Attack'         },
  { key: 'shield',  name: 'Shield',     price: 25, desc: '25% dodge'         },
  { key: 'bow',     name: 'Bow',        price: 30, desc: 'First strike x1'   },
  { key: 'pouch',   name: 'H.Pouch',   price: 20, desc: '+2 MaxHP+2 Potions' },
  { key: 'mstaff',  name: 'MagicStaff', price: 50, desc: '+2 Attack'         },
  { key: 'dshield', name: 'DrgnShield', price: 60, desc: '50% dodge'         },
  { key: 'ebow',    name: 'Ench.Bow',   price: 70, desc: 'First strike x2'   },
  { key: 'hring',   name: 'HealRing',   price: 60, desc: '+3 HP/victory'     },
]

function getPotionMax(): number { return hasPouch ? 5 : 3 }

function getItemOwned(key: string): boolean {
  if (key === 'potion')  return potionCount >= getPotionMax()
  if (key === 'sword')   return hasSword
  if (key === 'shield')  return hasShield
  if (key === 'bow')     return hasBow
  if (key === 'pouch')   return hasPouch
  if (key === 'mstaff')  return hasMagicStaff
  if (key === 'dshield') return hasDragonShield
  if (key === 'ebow')    return hasEnchantedBow
  if (key === 'hring')   return hasHealingRing
  return false
}

function inventoryCount(): number {
  return [hasSword, hasShield, hasBow, hasPouch,
          hasMagicStaff, hasDragonShield, hasEnchantedBow,
          hasHealingRing, hasSoulStone, hasCursedBlade].filter(Boolean).length
}

function getInventoryDisplay(): string {
  const items: string[] = []
  if (potionCount > 0)  items.push('POT:' + potionCount)
  if (hasSword)         items.push('Sw')
  if (hasShield)        items.push('Sh')
  if (hasBow)           items.push('Bo')
  if (hasPouch)         items.push('Po')
  if (hasMagicStaff)    items.push('Ms')
  if (hasDragonShield)  items.push('Ds')
  if (hasEnchantedBow)  items.push('Eb')
  if (hasHealingRing)   items.push('Hr')
  if (hasSoulStone)     items.push('SS')
  if (hasCursedBlade)   items.push('CB')
  if (tempAtkBonus > 0) items.push('+Sw')
  if (tempLucky)        items.push('+Lk')
  return items.length > 0 ? items.join(' ') : 'empty'
}

// ═══════════════════════════════════════
// ENEMIES
// ═══════════════════════════════════════

const ENEMIES: Record<number, { name: string; hp: number; location: string; gold: number }> = {
  1:  { name: 'Cave Slime',        hp: 3,  location: 'CAVE ENTRANCE',   gold: 5   },
  2:  { name: 'Skeleton Warrior',  hp: 5,  location: 'ANCIENT RUINS',   gold: 10  },
  3:  { name: 'Giant Spider',      hp: 5,  location: 'SPIDER DEN',      gold: 15  },
  4:  { name: 'Werewolf',          hp: 7,  location: 'DARK CLEARING',   gold: 20  },
  5:  { name: 'Troll',             hp: 9,  location: 'TROLL BRIDGE',    gold: 30  },
  6:  { name: 'Shadow Lord',       hp: 12, location: 'DARK LAIR',       gold: 100 },
  7:  { name: 'Banshee',           hp: 8,  location: 'HAUNTED GROVE',   gold: 25  },
  8:  { name: 'Vampire',           hp: 10, location: 'DARK HOLLOW',     gold: 35  },
  9:  { name: 'Bog Wraith',        hp: 8,  location: 'MURKY SWAMP',     gold: 30  },
  10: { name: 'Swamp Hydra',       hp: 11, location: 'HYDRA POOL',      gold: 40  },
  11: { name: 'Death Knight',      hp: 13, location: 'CURSED BRIDGE',   gold: 60  },
  12: { name: 'Stone Gargoyle',    hp: 8,  location: 'DUNGEON GATE',    gold: 35  },
  13: { name: 'Necromancer',       hp: 10, location: 'BONE CHAMBER',    gold: 45  },
  14: { name: 'Cursed Knight',     hp: 12, location: 'IRON HALL',       gold: 55  },
  15: { name: 'Stone Gargoyle II', hp: 11, location: 'DEEP GATE',       gold: 40  },
  16: { name: 'Necromancer II',    hp: 13, location: 'DARK CHAMBER',    gold: 50  },
  17: { name: 'Cursed Knight II',  hp: 15, location: 'IRON KEEP',       gold: 65  },
  18: { name: 'Dark Dragon',       hp: 13, location: 'DRAGON LAIR',     gold: 70  },
  19: { name: 'Dark Dragon',       hp: 16, location: 'DRAGON DEN',      gold: 80  },
  20: { name: 'Dragon Elder',      hp: 18, location: 'ELDER LAIR',      gold: 85  },
  21: { name: 'Dragon King',       hp: 20, location: 'THRONE OF FLAME', gold: 100 },
}

function getCurrentEnemy() {
  if (questPhase <= 2)  return ENEMIES[1]
  if (questPhase <= 5)  return ENEMIES[2]
  if (questPhase <= 8)  return ENEMIES[3]
  if (questPhase <= 11) return ENEMIES[4]
  if (questPhase <= 14) return ENEMIES[5]
  if (questPhase <= 17) return ENEMIES[7]
  if (questPhase <= 20) return ENEMIES[8]
  if (questPhase <= 23) return ENEMIES[9]
  if (questPhase <= 26) return ENEMIES[10]
  if (questPhase <= 29) return ENEMIES[11]
  if (questPhase <= 32) return ENEMIES[12]
  if (questPhase <= 35) return ENEMIES[13]
  if (questPhase <= 38) return ENEMIES[14]
  if (questPhase <= 41) return ENEMIES[15]
  if (questPhase <= 44) return ENEMIES[16]
  if (questPhase <= 47) return ENEMIES[17]
  if (questPhase <= 50) return ENEMIES[18]
  if (questPhase <= 53) return ENEMIES[19]
  if (questPhase <= 56) return ENEMIES[20]
  if (questPhase <= 59) return ENEMIES[21]
  return ENEMIES[6]
}

function getActiveEnemyId(): number {
  if (isBossFight) return 6
  if (questPhase <= 2)  return 1
  if (questPhase <= 5)  return 2
  if (questPhase <= 8)  return 3
  if (questPhase <= 11) return 4
  if (questPhase <= 14) return 5
  if (questPhase <= 17) return 7
  if (questPhase <= 20) return 8
  if (questPhase <= 23) return 9
  if (questPhase <= 26) return 10
  if (questPhase <= 29) return 11
  if (questPhase <= 32) return 12
  if (questPhase <= 35) return 13
  if (questPhase <= 38) return 14
  if (questPhase <= 41) return 15
  if (questPhase <= 44) return 16
  if (questPhase <= 47) return 17
  if (questPhase <= 50) return 18
  if (questPhase <= 53) return 19
  if (questPhase <= 56) return 20
  return 21
}

function dealDamage(): number {
  let dmg = 1 + (attackBonus > 0 && Math.random() < attackBonus * 0.15 ? 1 : 0)
  if (tempAtkBonus > 0) dmg += tempAtkBonus
  if (shapeIndex === 4 && Math.random() < 0.2) dmg *= 2
  if (tempLucky && Math.random() < 0.5) dmg *= 2
  return dmg
}

function getBossPhase(): number {
  if (enemyCurrentHP >= 8) return 1
  if (enemyCurrentHP >= 4) return 2
  return 3
}

function getDodgeChance(): number {
  let c = 0
  if (hasDragonShield)  c = 0.5
  else if (hasShield)   c = 0.25
  if (shapeIndex === 2) c = Math.min(0.75, c + 0.15)
  return c
}

// ═══════════════════════════════════════
// SAVE / LOAD
// ═══════════════════════════════════════

function saveProgress() {
  try {
    localStorage.setItem('wp_phase', String(questPhase))
    localStorage.setItem('wp_name',  charName)
    localStorage.setItem('wp_shape', String(shapeIndex))
    localStorage.setItem('wp_maxhp', String(maxPlayerHP))
    localStorage.setItem('wp_atk',   String(attackBonus))
    localStorage.setItem('wp_gold',  String(playerGold))
    localStorage.setItem('wp_pot',   String(potionCount))
    localStorage.setItem('wp_fw',    String(fightsWon))
    localStorage.setItem('wp_pow',   powerUsed      ? '1' : '0')
    localStorage.setItem('wp_sf',    secretFound    ? '1' : '0')
    localStorage.setItem('wp_d1',    dot1Collected  ? '1' : '0')
    localStorage.setItem('wp_d2',    dot2Collected  ? '1' : '0')
    localStorage.setItem('wp_d3',    dot3Collected  ? '1' : '0')
    localStorage.setItem('wp_d4',    dot4Collected  ? '1' : '0')
    localStorage.setItem('wp_d5',    dot5Collected  ? '1' : '0')
    localStorage.setItem('wp_d6',    dot6Collected  ? '1' : '0')
    localStorage.setItem('wp_d7',    dot7Collected  ? '1' : '0')
    localStorage.setItem('wp_d8',    dot8Collected  ? '1' : '0')
    localStorage.setItem('wp_isw',   hasSword        ? '1' : '0')
    localStorage.setItem('wp_ish',   hasShield       ? '1' : '0')
    localStorage.setItem('wp_ibo',   hasBow          ? '1' : '0')
    localStorage.setItem('wp_ipo',   hasPouch        ? '1' : '0')
    localStorage.setItem('wp_ims',   hasMagicStaff   ? '1' : '0')
    localStorage.setItem('wp_ids',   hasDragonShield ? '1' : '0')
    localStorage.setItem('wp_ieb',   hasEnchantedBow ? '1' : '0')
    localStorage.setItem('wp_ihr',   hasHealingRing  ? '1' : '0')
    localStorage.setItem('wp_iss',   hasSoulStone    ? '1' : '0')
    localStorage.setItem('wp_icb',   hasCursedBlade  ? '1' : '0')
  } catch (e) {}
}

function loadProgress() {
  try {
    const p = localStorage.getItem('wp_phase')
    if (p !== null) questPhase = Math.max(0, Math.min(61, parseInt(p)||0))
    const n = localStorage.getItem('wp_name'); if (n) charName = n
    const s = localStorage.getItem('wp_shape')
    if (s !== null) { shapeIndex = Math.max(0, Math.min(5, parseInt(s)||0)); charShape = SHAPES[shapeIndex] }
    const hp = localStorage.getItem('wp_maxhp')
    if (hp !== null) maxPlayerHP = Math.max(5, parseInt(hp)||5)
    const atk = localStorage.getItem('wp_atk')
    if (atk !== null) attackBonus = Math.max(0, parseInt(atk)||0)
    const gold = localStorage.getItem('wp_gold')
    if (gold !== null) playerGold = Math.max(0, parseInt(gold)||0)
    const pot = localStorage.getItem('wp_pot')
    if (pot !== null) potionCount = Math.max(0, Math.min(5, parseInt(pot)||0))
    const fw = localStorage.getItem('wp_fw')
    if (fw !== null) fightsWon = Math.max(0, parseInt(fw)||0)
    powerUsed       = localStorage.getItem('wp_pow') === '1'
    secretFound     = localStorage.getItem('wp_sf')  === '1'
    dot1Collected   = localStorage.getItem('wp_d1')  === '1'
    dot2Collected   = localStorage.getItem('wp_d2')  === '1'
    dot3Collected   = localStorage.getItem('wp_d3')  === '1'
    dot4Collected   = localStorage.getItem('wp_d4')  === '1'
    dot5Collected   = localStorage.getItem('wp_d5')  === '1'
    dot6Collected   = localStorage.getItem('wp_d6')  === '1'
    dot7Collected   = localStorage.getItem('wp_d7')  === '1'
    dot8Collected   = localStorage.getItem('wp_d8')  === '1'
    hasSword        = localStorage.getItem('wp_isw') === '1'
    hasShield       = localStorage.getItem('wp_ish') === '1'
    hasBow          = localStorage.getItem('wp_ibo') === '1'
    hasPouch        = localStorage.getItem('wp_ipo') === '1'
    hasMagicStaff   = localStorage.getItem('wp_ims') === '1'
    hasDragonShield = localStorage.getItem('wp_ids') === '1'
    hasEnchantedBow = localStorage.getItem('wp_ieb') === '1'
    hasHealingRing  = localStorage.getItem('wp_ihr') === '1'
    hasSoulStone    = localStorage.getItem('wp_iss') === '1'
    hasCursedBlade  = localStorage.getItem('wp_icb') === '1'
  } catch (e) {}
}

function clearProgress() {
  try {
    ['wp_phase','wp_name','wp_shape','wp_maxhp','wp_atk','wp_gold','wp_pot','wp_fw',
     'wp_pow','wp_sf','wp_d1','wp_d2','wp_d3','wp_d4','wp_d5','wp_d6','wp_d7','wp_d8',
     'wp_isw','wp_ish','wp_ibo','wp_ipo','wp_ims','wp_ids','wp_ieb','wp_ihr','wp_iss','wp_icb'
    ].forEach(k => localStorage.removeItem(k))
  } catch (e) {}
  questPhase = 0; charName = 'Wanderer'; shapeIndex = 0; charShape = '▲'
  maxPlayerHP = 5; attackBonus = 0; playerGold = 0; powerUsed = false
  potionCount = 0; fightsWon = 0; tempAtkBonus = 0; tempLucky = false; secretFound = false
  dot1Collected = false; dot2Collected = false; dot3Collected = false; dot4Collected = false
  dot5Collected = false; dot6Collected = false; dot7Collected = false; dot8Collected = false
  hasSword = false; hasShield = false; hasBow = false; hasPouch = false
  hasMagicStaff = false; hasDragonShield = false; hasEnchantedBow = false
  hasHealingRing = false; hasSoulStone = false; hasCursedBlade = false
  poisoned = false; trollCharging = false; bansheeStunned = false
  hydraRegrown = false; necroRevived = false; gargoyleStoned = false
  isBossFight = false; bossShielded = false
}

function hasSave(): boolean {
  try { const v = localStorage.getItem('wp_phase'); return v !== null && parseInt(v) > 0 } catch (e) { return false }
}

function confirmCharacter() {
  charShape = SHAPES[shapeIndex]
  switch (shapeIndex) {
    case 0: maxPlayerHP = 5; attackBonus = 0; break
    case 1: maxPlayerHP = 7; attackBonus = 0; break
    case 2: maxPlayerHP = 5; attackBonus = 0; break
    case 3: maxPlayerHP = 5; attackBonus = 1; break
    case 4: maxPlayerHP = 5; attackBonus = 0; break
    case 5: maxPlayerHP = 6; attackBonus = 0; break
  }
  playerHP = maxPlayerHP; powerUsed = false; saveProgress()
  playerX = 3; playerY = 5; lastBuiltIsExplore = false
  showScreen('explore')
}

// ═══════════════════════════════════════
// RANDOM FIND
// ═══════════════════════════════════════

function tryRandomFind(returnTo: 'explore' | 'forestExplore' | 'swampExplore' | 'dungeonExplore'): boolean {
  if (Math.random() > 0.01) return false
  const items = ['potion','gold','sword','charm']
  const item = items[Math.floor(Math.random() * items.length)]
  if (item === 'potion') {
    if (potionCount >= getPotionMax()) return false
    potionCount++
    foundItemMessage = 'You found a\nHealth Potion!\nPOT:' + potionCount + '/' + getPotionMax()
  } else if (item === 'gold') {
    const amount = Math.floor(Math.random() * 11) + 5
    playerGold += amount
    foundItemMessage = 'You found\n' + amount + ' gold coins!\nG:' + playerGold
  } else if (item === 'sword') {
    tempAtkBonus = 1
    foundItemMessage = 'You found an\nOld Sword!\n+1 ATK next fight'
  } else {
    tempLucky = true
    foundItemMessage = 'You found a\nLucky Charm!\n2x dmg next fight'
  }
  saveProgress(); returnScreenAfterFind = returnTo; return true
}

// ═══════════════════════════════════════
// MILLHAVEN MAP
// ═══════════════════════════════════════

const MAP_W = 48, MAP_H = 11
const BRAM_X = 8, BRAM_Y = 3
const CAVE1_X = 38, CAVE1_Y = 3
const GRETA_X = 8, GRETA_Y = 7
const RUINS_X = 38, RUINS_Y = 7
const MFOREST_X = 24, MFOREST_Y = 9
const MERCHANT_X = 14, MERCHANT_Y = 3
const DOT1_X = 25, DOT1_Y = 4
const DOT2_X = 25, DOT2_Y = 6
const SECRET_X = 38, SECRET_Y = 5

let playerX = 3, playerY = 5

const mapBase: string[] = [
  '################################################',
  '#                                              #',
  '#  [#]            [#]                          #',
  '#  [#]            [#]                  C       #',
  '#                                              #',
  '#                                              #',
  '#  [#]            [#]                          #',
  '#  [#]            [#]                  R       #',
  '#                                              #',
  '#                       F                      #',
  '################################################',
]

function isWalkable(x: number, y: number): boolean {
  if (x < 1 || x >= MAP_W - 1 || y < 1 || y >= MAP_H - 1) return false
  const row = mapBase[y]; if (!row || x >= row.length) return false
  const cell = row[x]
  if (cell === '#' || cell === '[' || cell === ']') return false
  if (cell === 'R' && questPhase < 3) return false
  if (cell === 'F' && questPhase < 6) return false
  return true
}

function checkDotPickup() {
  if (!dot1Collected && playerX === DOT1_X && playerY === DOT1_Y) {
    dot1Collected = true; if (playerHP < maxPlayerHP) { playerHP++; dotCollectedThisMove = true }; saveProgress()
  }
  if (!dot2Collected && playerX === DOT2_X && playerY === DOT2_Y) {
    dot2Collected = true; if (playerHP < maxPlayerHP) { playerHP++; dotCollectedThisMove = true }; saveProgress()
  }
}

function movePlayerWithTileCheck(dx: number, dy: number, maxSteps: number): Screen | null {
  for (let i = 0; i < maxSteps; i++) {
    const nx = playerX + dx, ny = playerY + dy
    if (isWalkable(nx, ny)) {
      playerX = nx; playerY = ny; checkDotPickup()
      const s = checkSpecialTile(); if (s !== null) return s
      if (tryRandomFind('explore')) return 'foundItem'
    } else break
  }
  return null
}

function checkSpecialTile(): Screen | null {
  if (questPhase < 3 && playerX === BRAM_X && playerY === BRAM_Y) {
    if (questPhase === 0) return 'bram1'
    if (questPhase === 2) return 'bramReward'
  }
  if (questPhase >= 3 && questPhase <= 5 && playerX === GRETA_X && playerY === GRETA_Y) {
    if (questPhase === 3) return 'greta1'
    if (questPhase === 5) return 'gretaReward'
  }
  if (playerX === SECRET_X && playerY === SECRET_Y && questPhase >= 8 && !secretFound) return 'secretUpgrade'
  if (playerX === MERCHANT_X && playerY === MERCHANT_Y) return 'merchant'
  if (playerX === CAVE1_X && playerY === CAVE1_Y && questPhase === 1) return 'combat'
  if (playerX === RUINS_X && playerY === RUINS_Y && questPhase === 4) return 'combat'
  if (playerX === MFOREST_X && playerY === MFOREST_Y && questPhase >= 6) return 'forestExplore'
  return null
}

function renderMap(): string {
  const grid = mapBase.map(r => r.split(''))
  if (questPhase < 3) grid[BRAM_Y][BRAM_X] = 'B'
  if (questPhase >= 3 && questPhase <= 5) grid[GRETA_Y][GRETA_X] = 'G'
  if (questPhase < 3 || questPhase >= 6) grid[RUINS_Y][RUINS_X] = ' '
  if (questPhase < 6) grid[MFOREST_Y][MFOREST_X] = ' '
  grid[MERCHANT_Y][MERCHANT_X] = 'M'
  if (questPhase >= 8 && !secretFound) grid[SECRET_Y][SECRET_X] = '?'
  if (!dot1Collected) grid[DOT1_Y][DOT1_X] = '·'
  if (!dot2Collected) grid[DOT2_Y][DOT2_X] = '·'
  grid[playerY][playerX] = charShape
  return grid.map(r => r.join('')).join('\n')
}

function renderLegend(): string {
  const lines: string[] = [charShape + ' You']
  if (questPhase < 3)                     lines.push('B Bram')
  if (questPhase >= 3 && questPhase <= 5) lines.push('G Greta')
  if (questPhase >= 1 && questPhase < 3)  lines.push('C Cave')
  if (questPhase >= 3 && questPhase < 6)  lines.push('R Ruins')
  if (questPhase >= 6)                    lines.push('F Forest')
  lines.push('M Shop')
  if (questPhase >= 8 && !secretFound)    lines.push('? Secret!')
  lines.push('------')
  lines.push('HP:' + '♥'.repeat(playerHP) + ' ATK:+' + (attackBonus + tempAtkBonus))
  lines.push('G:' + playerGold + ' POT:' + potionCount)
  if (getInventoryDisplay() !== 'empty') lines.push(getInventoryDisplay())
  lines.push('------')
  if      (questPhase === 0) lines.push('Find Bram')
  else if (questPhase === 1) lines.push('Enter Cave')
  else if (questPhase === 2) lines.push('Return Bram')
  else if (questPhase === 3) lines.push('Find Greta')
  else if (questPhase === 4) lines.push('Enter Ruins')
  else if (questPhase === 5) lines.push('Ret. Greta')
  else if (questPhase >= 6 && questPhase < 60) lines.push('Go to Forest')
  else if (questPhase === 60) lines.push('Find Boss!')
  else lines.push('★ LEGEND ★')
  return lines.join('\n')
}

// ═══════════════════════════════════════
// FOREST MAP
// ═══════════════════════════════════════

const FOREST_W = 48, FOREST_H = 11
const FOREST_ARIA_X    = 8,  FOREST_ARIA_Y    = 3
const FOREST_GARETH_X  = 8,  FOREST_GARETH_Y  = 7
const FOREST_THORIN_X  = 22, FOREST_THORIN_Y  = 5
const FOREST_SPIDER_X  = 36, FOREST_SPIDER_Y  = 3
const FOREST_WOLF_X    = 36, FOREST_WOLF_Y    = 7
const FOREST_TROLL_X   = 28, FOREST_TROLL_Y   = 5
const FOREST_LYRA_X    = 22, FOREST_LYRA_Y    = 3
const FOREST_DORIN_X   = 22, FOREST_DORIN_Y   = 7
const FOREST_BANSHEE_X = 40, FOREST_BANSHEE_Y = 3
const FOREST_VAMPIRE_X = 40, FOREST_VAMPIRE_Y = 7
const FOREST_PORTAL_X  = 40, FOREST_PORTAL_Y  = 5
const FOREST_BOSS_X    = 36, FOREST_BOSS_Y    = 5
const FOREST_EXIT_X    = 11, FOREST_EXIT_Y    = 9
const DOT3_X = 20, DOT3_Y = 2
const DOT4_X = 20, DOT4_Y = 8

let forestPlayerX = 3, forestPlayerY = 9

const forestBase: string[] = [
  '################################################',
  '#                                              #',
  '# [T]                                    [T]  #',
  '# [T]                               S    [T]  #',
  '#                                              #',
  '#                           L                 #',
  '#                                              #',
  '# [T]                               W    [T]  #',
  '# [T]                                    [T]  #',
  '#          X                                  #',
  '################################################',
]

function isForestWalkable(x: number, y: number): boolean {
  if (x < 1 || x >= FOREST_W - 1 || y < 1 || y >= FOREST_H - 1) return false
  const row = forestBase[y]; if (!row || x >= row.length) return false
  const cell = row[x]
  if (cell === '#' || cell === '[' || cell === ']' || cell === 'T') return false
  if (cell === 'S' && questPhase !== 7)  return false
  if (cell === 'W' && questPhase !== 10) return false
  if (cell === 'L' && questPhase !== 13) return false
  return true
}

function checkForestDotPickup() {
  if (!dot3Collected && forestPlayerX === DOT3_X && forestPlayerY === DOT3_Y) {
    dot3Collected = true; if (playerHP < maxPlayerHP) { playerHP++; dotCollectedThisMove = true }; saveProgress()
  }
  if (!dot4Collected && forestPlayerX === DOT4_X && forestPlayerY === DOT4_Y) {
    dot4Collected = true; if (playerHP < maxPlayerHP) { playerHP++; dotCollectedThisMove = true }; saveProgress()
  }
}

function moveForestPlayerWithTileCheck(dx: number, dy: number, maxSteps: number): Screen | null {
  for (let i = 0; i < maxSteps; i++) {
    const nx = forestPlayerX + dx, ny = forestPlayerY + dy
    if (isForestWalkable(nx, ny)) {
      forestPlayerX = nx; forestPlayerY = ny; checkForestDotPickup()
      const s = checkForestSpecialTile(); if (s !== null) return s
      if (tryRandomFind('forestExplore')) return 'foundItem'
    } else break
  }
  return null
}

function checkForestSpecialTile(): Screen | null {
  if (questPhase >= 6 && questPhase <= 8 && forestPlayerX === FOREST_ARIA_X && forestPlayerY === FOREST_ARIA_Y) {
    if (questPhase === 6) return 'aria1'; if (questPhase === 8) return 'ariaReward'
  }
  if (questPhase >= 9 && questPhase <= 11 && forestPlayerX === FOREST_GARETH_X && forestPlayerY === FOREST_GARETH_Y) {
    if (questPhase === 9) return 'gareth1'; if (questPhase === 11) return 'garethReward'
  }
  if (questPhase >= 12 && questPhase <= 14 && forestPlayerX === FOREST_THORIN_X && forestPlayerY === FOREST_THORIN_Y) {
    if (questPhase === 12) return 'thorin1'; if (questPhase === 14) return 'thorinReward'
  }
  if (questPhase >= 15 && questPhase <= 17 && forestPlayerX === FOREST_LYRA_X && forestPlayerY === FOREST_LYRA_Y) {
    if (questPhase === 15) return 'lyra1'; if (questPhase === 17) return 'lyraReward'
  }
  if (questPhase >= 18 && questPhase <= 20 && forestPlayerX === FOREST_DORIN_X && forestPlayerY === FOREST_DORIN_Y) {
    if (questPhase === 18) return 'dorin1'; if (questPhase === 20) return 'dorinReward'
  }
  if (forestPlayerX === FOREST_SPIDER_X  && forestPlayerY === FOREST_SPIDER_Y  && questPhase === 7)  return 'combat'
  if (forestPlayerX === FOREST_WOLF_X    && forestPlayerY === FOREST_WOLF_Y    && questPhase === 10) return 'combat'
  if (forestPlayerX === FOREST_TROLL_X   && forestPlayerY === FOREST_TROLL_Y   && questPhase === 13) return 'trollGreet'
  if (forestPlayerX === FOREST_BANSHEE_X && forestPlayerY === FOREST_BANSHEE_Y && questPhase === 16) return 'combat'
  if (forestPlayerX === FOREST_VAMPIRE_X && forestPlayerY === FOREST_VAMPIRE_Y && questPhase === 19) return 'combat'
  if (forestPlayerX === FOREST_PORTAL_X  && forestPlayerY === FOREST_PORTAL_Y  && questPhase >= 21 && questPhase <= 29) return 'swampExplore'
  if (forestPlayerX === FOREST_BOSS_X    && forestPlayerY === FOREST_BOSS_Y    && questPhase === 60) return 'bossGreet'
  if (forestPlayerX === FOREST_EXIT_X    && forestPlayerY === FOREST_EXIT_Y) return 'explore'
  return null
}

function renderForestMap(): string {
  const grid = forestBase.map(r => r.split(''))
  if (questPhase >= 6  && questPhase <= 8)  grid[FOREST_ARIA_Y][FOREST_ARIA_X]     = 'A'
  if (questPhase >= 9  && questPhase <= 11) grid[FOREST_GARETH_Y][FOREST_GARETH_X] = 'G'
  if (questPhase >= 12 && questPhase <= 14) grid[FOREST_THORIN_Y][FOREST_THORIN_X] = 'H'
  if (questPhase >= 15 && questPhase <= 17) grid[FOREST_LYRA_Y][FOREST_LYRA_X]     = 'Y'
  if (questPhase >= 18 && questPhase <= 20) grid[FOREST_DORIN_Y][FOREST_DORIN_X]   = 'D'
  if (questPhase !== 7)  grid[FOREST_SPIDER_Y][FOREST_SPIDER_X] = ' '
  if (questPhase !== 10) grid[FOREST_WOLF_Y][FOREST_WOLF_X]     = ' '
  if (questPhase !== 13) grid[FOREST_TROLL_Y][FOREST_TROLL_X]   = ' '
  if (questPhase === 16) grid[FOREST_BANSHEE_Y][FOREST_BANSHEE_X] = 'N'
  if (questPhase === 19) grid[FOREST_VAMPIRE_Y][FOREST_VAMPIRE_X] = 'V'
  if (questPhase >= 21 && questPhase <= 29) grid[FOREST_PORTAL_Y][FOREST_PORTAL_X] = 'P'
  if (questPhase === 60) grid[FOREST_BOSS_Y][FOREST_BOSS_X] = 'K'
  if (!dot3Collected) grid[DOT3_Y][DOT3_X] = '·'
  if (!dot4Collected) grid[DOT4_Y][DOT4_X] = '·'
  grid[forestPlayerY][forestPlayerX] = charShape
  return grid.map(r => r.join('')).join('\n')
}

function renderForestLegend(): string {
  const lines: string[] = [charShape + ' You', 'X Exit']
  if (questPhase >= 6  && questPhase <= 8)  lines.push('A Aria')
  if (questPhase >= 9  && questPhase <= 11) lines.push('G Gareth')
  if (questPhase >= 12 && questPhase <= 14) lines.push('H Thorin')
  if (questPhase >= 15 && questPhase <= 17) lines.push('Y Lyra')
  if (questPhase >= 18 && questPhase <= 20) lines.push('D Dorin')
  if (questPhase === 7)  lines.push('S Spider')
  if (questPhase === 10) lines.push('W Wolf')
  if (questPhase === 13) lines.push('L Troll')
  if (questPhase === 16) lines.push('N Banshee')
  if (questPhase === 19) lines.push('V Vampire')
  if (questPhase >= 21 && questPhase <= 29) lines.push('P Swamp')
  if (questPhase === 60) lines.push('K BOSS!')
  lines.push('------')
  lines.push('HP:' + '♥'.repeat(playerHP) + ' ATK:+' + (attackBonus + tempAtkBonus))
  lines.push('G:' + playerGold + ' POT:' + potionCount)
  if (getInventoryDisplay() !== 'empty') lines.push(getInventoryDisplay())
  lines.push('------')
  if      (questPhase === 6)  lines.push('Find Aria')
  else if (questPhase === 7)  lines.push('Spider Den S')
  else if (questPhase === 8)  lines.push('Ret. Aria')
  else if (questPhase === 9)  lines.push('Find Gareth')
  else if (questPhase === 10) lines.push('Wolf Clear W')
  else if (questPhase === 11) lines.push('Ret. Gareth')
  else if (questPhase === 12) lines.push('Find Thorin')
  else if (questPhase === 13) lines.push('Troll Bridg L')
  else if (questPhase === 14) lines.push('Ret. Thorin')
  else if (questPhase === 15) lines.push('Find Lyra Y')
  else if (questPhase === 16) lines.push('Banshee N')
  else if (questPhase === 17) lines.push('Ret. Lyra')
  else if (questPhase === 18) lines.push('Find Dorin D')
  else if (questPhase === 19) lines.push('Vampire V')
  else if (questPhase === 20) lines.push('Ret. Dorin')
  else if (questPhase >= 21 && questPhase <= 29) lines.push('Swamp P')
  else if (questPhase >= 30 && questPhase <= 59) lines.push('Dungeon ahead')
  else if (questPhase === 60) lines.push('Find Boss K')
  else lines.push('★ LEGEND ★')
  return lines.join('\n')
}

// ═══════════════════════════════════════
// SWAMP MAP
// ═══════════════════════════════════════

const SWAMP_W = 48, SWAMP_H = 11
const SWAMP_MIRA_X     = 8,  SWAMP_MIRA_Y     = 3
const SWAMP_ZANE_X     = 8,  SWAMP_ZANE_Y     = 7
const SWAMP_WRAITH_X   = 36, SWAMP_WRAITH_Y   = 3
const SWAMP_HYDRA_X    = 36, SWAMP_HYDRA_Y    = 7
const SWAMP_KNIGHT_X   = 28, SWAMP_KNIGHT_Y   = 5
const SWAMP_MERCHANT_X = 14, SWAMP_MERCHANT_Y = 5
const SWAMP_DUNGEON_X  = 36, SWAMP_DUNGEON_Y  = 9
const SWAMP_EXIT_X     = 11, SWAMP_EXIT_Y     = 9
const DOT5_X = 25, DOT5_Y = 4
const DOT6_X = 25, DOT6_Y = 6

let swampPlayerX = 3, swampPlayerY = 9

const swampBase: string[] = [
  '################################################',
  '#                                              #',
  '# [R]                                    [R]  #',
  '# [R]                               W    [R]  #',
  '#                                              #',
  '#                           K                 #',
  '#                                              #',
  '# [R]                               H    [R]  #',
  '# [R]                                    [R]  #',
  '#          X                                  #',
  '################################################',
]

function isSwampWalkable(x: number, y: number): boolean {
  if (x < 1 || x >= SWAMP_W - 1 || y < 1 || y >= SWAMP_H - 1) return false
  const row = swampBase[y]; if (!row || x >= row.length) return false
  const cell = row[x]
  if (cell === '#' || cell === '[' || cell === ']' || cell === 'R') return false
  if (cell === 'W' && questPhase !== 22) return false
  if (cell === 'H' && questPhase !== 25) return false
  if (cell === 'K' && questPhase !== 28) return false
  return true
}

function checkSwampDotPickup() {
  if (!dot5Collected && swampPlayerX === DOT5_X && swampPlayerY === DOT5_Y) {
    dot5Collected = true; if (playerHP < maxPlayerHP) { playerHP++; dotCollectedThisMove = true }; saveProgress()
  }
  if (!dot6Collected && swampPlayerX === DOT6_X && swampPlayerY === DOT6_Y) {
    dot6Collected = true; if (playerHP < maxPlayerHP) { playerHP++; dotCollectedThisMove = true }; saveProgress()
  }
}

function moveSwampPlayerWithTileCheck(dx: number, dy: number, maxSteps: number): Screen | null {
  for (let i = 0; i < maxSteps; i++) {
    const nx = swampPlayerX + dx, ny = swampPlayerY + dy
    if (isSwampWalkable(nx, ny)) {
      swampPlayerX = nx; swampPlayerY = ny; checkSwampDotPickup()
      const s = checkSwampSpecialTile(); if (s !== null) return s
      if (tryRandomFind('swampExplore')) return 'foundItem'
    } else break
  }
  return null
}

function checkSwampSpecialTile(): Screen | null {
  if (questPhase >= 21 && questPhase <= 26 && swampPlayerX === SWAMP_MIRA_X && swampPlayerY === SWAMP_MIRA_Y) {
    if (questPhase === 21) return 'mira1'
    if (questPhase === 23) return 'miraReward'
    if (questPhase === 24) return 'mira3'
    if (questPhase === 26) return 'mira2Reward'
  }
  if (questPhase >= 27 && questPhase <= 29 && swampPlayerX === SWAMP_ZANE_X && swampPlayerY === SWAMP_ZANE_Y) {
    if (questPhase === 27) return 'zane1'
    if (questPhase === 29) return 'zaneReward'
  }
  if (swampPlayerX === SWAMP_WRAITH_X   && swampPlayerY === SWAMP_WRAITH_Y   && questPhase === 22) return 'combat'
  if (swampPlayerX === SWAMP_HYDRA_X    && swampPlayerY === SWAMP_HYDRA_Y    && questPhase === 25) return 'combat'
  if (swampPlayerX === SWAMP_KNIGHT_X   && swampPlayerY === SWAMP_KNIGHT_Y   && questPhase === 28) return 'combat'
  if (swampPlayerX === SWAMP_MERCHANT_X && swampPlayerY === SWAMP_MERCHANT_Y) return 'swampShop'
  if (swampPlayerX === SWAMP_DUNGEON_X  && swampPlayerY === SWAMP_DUNGEON_Y  && questPhase >= 30) return 'dungeonExplore'
  if (swampPlayerX === SWAMP_EXIT_X     && swampPlayerY === SWAMP_EXIT_Y) return 'forestExplore'
  return null
}

function renderSwampMap(): string {
  const grid = swampBase.map(r => r.split(''))
  if (questPhase >= 21 && questPhase <= 26) grid[SWAMP_MIRA_Y][SWAMP_MIRA_X]   = 'M'
  if (questPhase >= 27 && questPhase <= 29) grid[SWAMP_ZANE_Y][SWAMP_ZANE_X]   = 'Z'
  if (questPhase !== 22) grid[SWAMP_WRAITH_Y][SWAMP_WRAITH_X] = ' '
  if (questPhase !== 25) grid[SWAMP_HYDRA_Y][SWAMP_HYDRA_X]   = ' '
  if (questPhase !== 28) grid[SWAMP_KNIGHT_Y][SWAMP_KNIGHT_X] = ' '
  grid[SWAMP_MERCHANT_Y][SWAMP_MERCHANT_X] = 'S'
  if (questPhase >= 30) grid[SWAMP_DUNGEON_Y][SWAMP_DUNGEON_X] = 'D'
  grid[SWAMP_EXIT_Y][SWAMP_EXIT_X] = 'X'
  if (!dot5Collected) grid[DOT5_Y][DOT5_X] = '·'
  if (!dot6Collected) grid[DOT6_Y][DOT6_X] = '·'
  grid[swampPlayerY][swampPlayerX] = charShape
  return grid.map(r => r.join('')).join('\n')
}

function renderSwampLegend(): string {
  const lines: string[] = [charShape + ' You', 'X Exit', 'S Shop']
  if (questPhase >= 21 && questPhase <= 26) lines.push('M Mira')
  if (questPhase >= 27 && questPhase <= 29) lines.push('Z Zane')
  if (questPhase === 22) lines.push('W Wraith')
  if (questPhase === 25) lines.push('H Hydra')
  if (questPhase === 28) lines.push('K Knight')
  if (questPhase >= 30) lines.push('D Dungeon')
  lines.push('------')
  lines.push('HP:' + '♥'.repeat(playerHP) + ' ATK:+' + (attackBonus + tempAtkBonus))
  lines.push('G:' + playerGold + ' POT:' + potionCount)
  if (getInventoryDisplay() !== 'empty') lines.push(getInventoryDisplay())
  lines.push('------')
  if      (questPhase === 21) lines.push('Find Mira M')
  else if (questPhase === 22) lines.push('Wraith W')
  else if (questPhase === 23) lines.push('Ret. Mira')
  else if (questPhase === 24) lines.push('Find Mira M')
  else if (questPhase === 25) lines.push('Hydra H')
  else if (questPhase === 26) lines.push('Ret. Mira')
  else if (questPhase === 27) lines.push('Find Zane Z')
  else if (questPhase === 28) lines.push('Death Knight K')
  else if (questPhase === 29) lines.push('Ret. Zane')
  else if (questPhase >= 30) lines.push('Dungeon D')
  return lines.join('\n')
}// ═══════════════════════════════════════
// DUNGEON MAP
// ═══════════════════════════════════════

const DUNGEON_W = 48, DUNGEON_H = 11
const DUNG_ROOK_X    = 8,  DUNG_ROOK_Y    = 3
const DUNG_VERA_X    = 8,  DUNG_VERA_Y    = 7
const DUNG_MOSS_X    = 22, DUNG_MOSS_Y    = 5
const DUNG_THANE_X   = 36, DUNG_THANE_Y   = 3
const DUNG_GARG_X    = 36, DUNG_GARG_Y    = 7
const DUNG_NECRO_X   = 28, DUNG_NECRO_Y   = 7
const DUNG_KNIGHT_X  = 28, DUNG_KNIGHT_Y  = 3
const DUNG_DRAGON_X  = 22, DUNG_DRAGON_Y  = 3
const DUNG_SHOP_X    = 14, DUNG_SHOP_Y    = 5
const DUNG_EXIT_X    = 11, DUNG_EXIT_Y    = 9
const DOT7_X = 25, DOT7_Y = 4
const DOT8_X = 25, DOT8_Y = 6

let dungeonPlayerX = 3, dungeonPlayerY = 9

const dungeonBase: string[] = [
  '################################################',
  '#                                              #',
  '# [P]                                    [P]  #',
  '# [P]                                    [P]  #',
  '#                                              #',
  '#                                              #',
  '#                                              #',
  '# [P]                                    [P]  #',
  '# [P]                                    [P]  #',
  '#          X                                  #',
  '################################################',
]

function isDungeonWalkable(x: number, y: number): boolean {
  if (x < 1 || x >= DUNGEON_W - 1 || y < 1 || y >= DUNGEON_H - 1) return false
  const row = dungeonBase[y]; if (!row || x >= row.length) return false
  const cell = row[x]
  if (cell === '#' || cell === '[' || cell === ']' || cell === 'P') return false
  return true
}

function checkDungeonDotPickup() {
  if (!dot7Collected && dungeonPlayerX === DOT7_X && dungeonPlayerY === DOT7_Y) {
    dot7Collected = true; if (playerHP < maxPlayerHP) { playerHP++; dotCollectedThisMove = true }; saveProgress()
  }
  if (!dot8Collected && dungeonPlayerX === DOT8_X && dungeonPlayerY === DOT8_Y) {
    dot8Collected = true; if (playerHP < maxPlayerHP) { playerHP++; dotCollectedThisMove = true }; saveProgress()
  }
}

function moveDungeonPlayerWithTileCheck(dx: number, dy: number, maxSteps: number): Screen | null {
  for (let i = 0; i < maxSteps; i++) {
    const nx = dungeonPlayerX + dx, ny = dungeonPlayerY + dy
    if (isDungeonWalkable(nx, ny)) {
      dungeonPlayerX = nx; dungeonPlayerY = ny; checkDungeonDotPickup()
      const s = checkDungeonSpecialTile(); if (s !== null) return s
      if (tryRandomFind('dungeonExplore')) return 'foundItem'
    } else break
  }
  return null
}

function checkDungeonSpecialTile(): Screen | null {
  // Rook: Q11 and Q12
  if (questPhase >= 30 && questPhase <= 35 && dungeonPlayerX === DUNG_ROOK_X && dungeonPlayerY === DUNG_ROOK_Y) {
    if (questPhase === 30) return 'rook1'
    if (questPhase === 32) return 'rookReward'
    if (questPhase === 33) return 'rook3'
    if (questPhase === 35) return 'rook2Reward'
  }
  // Vera: Q13, Q14, Q15
  if (questPhase >= 36 && questPhase <= 44 && dungeonPlayerX === DUNG_VERA_X && dungeonPlayerY === DUNG_VERA_Y) {
    if (questPhase === 36) return 'vera1'
    if (questPhase === 38) return 'veraReward'
    if (questPhase === 39) return 'vera3'
    if (questPhase === 41) return 'vera2Reward'
    if (questPhase === 42) return 'vera5'
    if (questPhase === 44) return 'vera3Reward'
  }
  // Elder Moss: Q16, Q17, Q18
  if (questPhase >= 45 && questPhase <= 53 && dungeonPlayerX === DUNG_MOSS_X && dungeonPlayerY === DUNG_MOSS_Y) {
    if (questPhase === 45) return 'moss1'
    if (questPhase === 47) return 'mossReward'
    if (questPhase === 48) return 'moss3'
    if (questPhase === 50) return 'moss2Reward'
    if (questPhase === 51) return 'moss5'
    if (questPhase === 53) return 'moss3Reward'
  }
  // Thane: Q19, Q20
  if (questPhase >= 54 && questPhase <= 59 && dungeonPlayerX === DUNG_THANE_X && dungeonPlayerY === DUNG_THANE_Y) {
    if (questPhase === 54) return 'thane1'
    if (questPhase === 56) return 'thaneReward'
    if (questPhase === 57) return 'thane3'
    if (questPhase === 59) return 'thane2Reward'
  }
  // Enemies
  if (dungeonPlayerX === DUNG_GARG_X   && dungeonPlayerY === DUNG_GARG_Y   && (questPhase === 31 || questPhase === 40)) return 'combat'
  if (dungeonPlayerX === DUNG_NECRO_X  && dungeonPlayerY === DUNG_NECRO_Y  && (questPhase === 34 || questPhase === 43)) return 'combat'
  if (dungeonPlayerX === DUNG_KNIGHT_X && dungeonPlayerY === DUNG_KNIGHT_Y && (questPhase === 37 || questPhase === 46)) return 'combat'
  if (dungeonPlayerX === DUNG_DRAGON_X && dungeonPlayerY === DUNG_DRAGON_Y && (questPhase === 49 || questPhase === 52 || questPhase === 55 || questPhase === 58)) return 'combat'
  if (dungeonPlayerX === DUNG_SHOP_X   && dungeonPlayerY === DUNG_SHOP_Y) return 'dungeonShop'
  if (dungeonPlayerX === DUNG_EXIT_X   && dungeonPlayerY === DUNG_EXIT_Y) return 'swampExplore'
  return null
}

function renderDungeonMap(): string {
  const grid = dungeonBase.map(r => r.split(''))
  if (questPhase >= 30 && questPhase <= 35) grid[DUNG_ROOK_Y][DUNG_ROOK_X]     = 'R'
  if (questPhase >= 36 && questPhase <= 44) grid[DUNG_VERA_Y][DUNG_VERA_X]     = 'V'
  if (questPhase >= 45 && questPhase <= 53) grid[DUNG_MOSS_Y][DUNG_MOSS_X]     = 'O'
  if (questPhase >= 54 && questPhase <= 59) grid[DUNG_THANE_Y][DUNG_THANE_X]   = 'T'
  if (questPhase === 31 || questPhase === 40) grid[DUNG_GARG_Y][DUNG_GARG_X]   = 'G'
  if (questPhase === 34 || questPhase === 43) grid[DUNG_NECRO_Y][DUNG_NECRO_X] = 'N'
  if (questPhase === 37 || questPhase === 46) grid[DUNG_KNIGHT_Y][DUNG_KNIGHT_X]= 'K'
  if (questPhase === 49 || questPhase === 52 || questPhase === 55 || questPhase === 58) grid[DUNG_DRAGON_Y][DUNG_DRAGON_X] = 'Q'
  grid[DUNG_SHOP_Y][DUNG_SHOP_X] = 'S'
  grid[DUNG_EXIT_Y][DUNG_EXIT_X] = 'X'
  if (!dot7Collected) grid[DOT7_Y][DOT7_X] = '·'
  if (!dot8Collected) grid[DOT8_Y][DOT8_X] = '·'
  grid[dungeonPlayerY][dungeonPlayerX] = charShape
  return grid.map(r => r.join('')).join('\n')
}

function renderDungeonLegend(): string {
  const lines: string[] = [charShape + ' You', 'X Exit', 'S Shop']
  if (questPhase >= 30 && questPhase <= 35) lines.push('R Rook')
  if (questPhase >= 36 && questPhase <= 44) lines.push('V Vera')
  if (questPhase >= 45 && questPhase <= 53) lines.push('O Moss')
  if (questPhase >= 54 && questPhase <= 59) lines.push('T Thane')
  if (questPhase === 31 || questPhase === 40) lines.push('G Gargoyle')
  if (questPhase === 34 || questPhase === 43) lines.push('N Necromancer')
  if (questPhase === 37 || questPhase === 46) lines.push('K Knight')
  if (questPhase === 49 || questPhase === 52 || questPhase === 55 || questPhase === 58) lines.push('Q Dragon')
  lines.push('------')
  lines.push('HP:' + '♥'.repeat(playerHP) + ' ATK:+' + (attackBonus + tempAtkBonus))
  lines.push('G:' + playerGold + ' POT:' + potionCount)
  if (getInventoryDisplay() !== 'empty') lines.push(getInventoryDisplay())
  lines.push('------')
  if      (questPhase === 30) lines.push('Find Rook R')
  else if (questPhase === 31) lines.push('Gargoyle G')
  else if (questPhase === 32) lines.push('Ret. Rook')
  else if (questPhase === 33) lines.push('Find Rook R')
  else if (questPhase === 34) lines.push('Necromancer N')
  else if (questPhase === 35) lines.push('Ret. Rook')
  else if (questPhase === 36) lines.push('Find Vera V')
  else if (questPhase === 37) lines.push('Knight K')
  else if (questPhase === 38) lines.push('Ret. Vera')
  else if (questPhase === 39) lines.push('Find Vera V')
  else if (questPhase === 40) lines.push('Gargoyle II G')
  else if (questPhase === 41) lines.push('Ret. Vera')
  else if (questPhase === 42) lines.push('Find Vera V')
  else if (questPhase === 43) lines.push('Necro II N')
  else if (questPhase === 44) lines.push('Ret. Vera')
  else if (questPhase === 45) lines.push('Find Moss O')
  else if (questPhase === 46) lines.push('Knight II K')
  else if (questPhase === 47) lines.push('Ret. Moss')
  else if (questPhase === 48) lines.push('Find Moss O')
  else if (questPhase === 49) lines.push('Dragon Young Q')
  else if (questPhase === 50) lines.push('Ret. Moss')
  else if (questPhase === 51) lines.push('Find Moss O')
  else if (questPhase === 52) lines.push('Dragon Q')
  else if (questPhase === 53) lines.push('Ret. Moss')
  else if (questPhase === 54) lines.push('Find Thane T')
  else if (questPhase === 55) lines.push('Dragon Elder Q')
  else if (questPhase === 56) lines.push('Ret. Thane')
  else if (questPhase === 57) lines.push('Find Thane T')
  else if (questPhase === 58) lines.push('Dragon King Q')
  else if (questPhase === 59) lines.push('Ret. Thane')
  else                        lines.push('Go to Forest!')
  return lines.join('\n')
}

// ═══════════════════════════════════════
// ANIMATION
// ═══════════════════════════════════════

let animationTimer: any = null
let animFrame = 0
const COLS = 45, ROWS = 10

function makeStars(): string {
  const chars = [' ',' ',' ',' ',' ',' ',' ','.','*','+','·','✦']
  const lines: string[] = []
  for (let r = 0; r < ROWS; r++) {
    let line = ''
    for (let c = 0; c < COLS; c++) line += chars[Math.floor(Math.random() * chars.length)]
    lines.push(line)
  }
  return lines.join('\n')
}

function makeTorch(npcName: string): string {
  const frame = animFrame % 4
  const fire = [
    ['    )  (     ','   ( \\/ )    ','   ) /\\ (    ','  (  )(  )   ',' ##########  '],
    ['   (  )  )   ','   )\\ /( (   ','  ( )\\/ )    ','  ) (  ) (   ',' ##########  '],
    ['    ( ) (    ','   ) \\/ (    ','   ( /\\ )    ','  )  )(  (   ',' ##########  '],
    ['   )  (  )   ','  ( \\/ ) (   ','   )/\\  )    ','  (  )( )    ',' ##########  '],
  ]
  const lines: string[] = ['                    ','  O                 ',' /|\\ ' + npcName.padEnd(15),' / \\                ','                    ']
  for (const fl of fire[frame]) lines.push(fl)
  lines.push('~~~~~~~~~~~~~~~~~~~~')
  lines.push('~~~~~~~~~~~~~~~~~~~~')
  return lines.slice(0, ROWS).join('\n')
}

function makeCoin(): string {
  const frame = animFrame % 4
  const coinFrames = ['$','(','|',')']
  const cx = Math.floor(COLS / 2)
  const lines: string[] = []
  for (let r = 0; r < ROWS; r++) {
    const line = new Array(COLS).fill(' ')
    if (r === 3) { line[cx] = coinFrames[frame]; line[cx-3] = frame%2===0?'$':'·'; line[cx+3] = frame%2===0?'·':'$' }
    if (r === 5) { line[cx-1] = '('; line[cx] = '$'; line[cx+1] = ')' }
    if (r === 7) { const pos = (animFrame * 3) % (COLS - 6) + 3; line[pos] = '$' }
    if (r === ROWS-1) { for (let c = 0; c < COLS; c++) line[c] = c%3===0?'~':' ' }
    lines.push(line.join(''))
  }
  return lines.join('\n')
}

function makeLightning(): string {
  const lines: string[] = []
  for (let r = 0; r < ROWS; r++) {
    const line = new Array(COLS).fill(' ')
    if (animFrame % 2 === 0) {
      const boltX = (animFrame * 5 + r * 4) % (COLS - 6) + 2
      line[boltX] = '|'; line[boltX+1] = animFrame % 4 < 2 ? '/' : '\\'; line[boltX+2] = '!'
    }
    if (animFrame % 3 === 0) {
      const boltX2 = (animFrame * 11 + r * 2 + 10) % (COLS - 4) + 2
      line[boltX2] = animFrame % 2 === 0 ? '*' : '+'
    }
    for (let c = 0; c < COLS; c++) {
      if (Math.random() < 0.08) line[c] = ['·','+','*','!','|'][Math.floor(Math.random()*5)]
    }
    if (r === ROWS - 1) {
      for (let c = 0; c < COLS; c++) line[c] = animFrame % 2 === 0 ? (c%3===0?'~':' ') : (c%2===0?'*':' ')
    }
    lines.push(line.join(''))
  }
  return lines.join('\n')
}

function makeDrips(): string {
  const grid: string[][] = []
  for (let r = 0; r < ROWS; r++) grid.push(new Array(COLS).fill(' '))
  const sP = [2, 7, 13, 19, 25, 31, 37, 43]
  for (const pos of sP) {
    if (pos < COLS) {
      grid[0][pos] = '▼'
      if (animFrame % 4 === 0) grid[1][pos] = '|'
      const dr = (animFrame + pos) % (ROWS - 1) + 1
      if (dr < ROWS) grid[dr][pos] = '·'
      if (dr === ROWS - 2) {
        if (pos > 0) grid[ROWS-1][pos-1] = '~'
        grid[ROWS-1][pos] = '*'
        if (pos < COLS-1) grid[ROWS-1][pos+1] = '~'
      }
    }
  }
  return grid.map(r => r.join('')).join('\n')
}

function makeDungeon(): string {
  const grid: string[][] = []
  for (let r = 0; r < ROWS; r++) grid.push(new Array(COLS).fill(' '))
  const cracks = [3, 9, 16, 22, 30, 38, 44]
  for (const pos of cracks) {
    if (pos < COLS) { grid[0][pos] = '█'; grid[1][pos] = '▼'; if (animFrame % 6 === 0) grid[2][pos] = '.' }
  }
  const sx = 18
  grid[3][sx] = '('; grid[3][sx+1] = animFrame%2===0?'o':'-'
  grid[3][sx+2] = animFrame%2===0?'o':'-'; grid[3][sx+3] = ')'
  grid[4][sx+1] = '\\'; grid[4][sx+2] = '/'
  grid[5][sx+1] = '|'; grid[5][sx+2] = '|'
  for (let c = 0; c < COLS; c++) grid[ROWS-1][c] = '='
  return grid.map(r => r.join('')).join('\n')
}

function makeDungeonBg(): string {
  const grid: string[][] = []
  for (let r = 0; r < ROWS; r++) grid.push(new Array(COLS).fill(' '))
  const torches = [5, 15, 25, 35, 44]
  for (const pos of torches) {
    if (pos < COLS) {
      grid[0][pos] = animFrame % 3 === 0 ? '*' : '|'
      grid[1][pos] = '|'
      if (pos > 0) grid[2][pos-1] = animFrame % 2 === 0 ? '(' : ' '
      if (pos < COLS-1) grid[2][pos+1] = animFrame % 2 === 0 ? ')' : ' '
    }
  }
  const shadow1 = (animFrame * 3) % COLS
  const shadow2 = (animFrame * 5 + 20) % COLS
  if (shadow1 < COLS) grid[5][shadow1] = '·'
  if (shadow2 < COLS) grid[7][shadow2] = '·'
  for (let c = 0; c < COLS; c++) grid[ROWS-1][c] = '='
  for (let c = 0; c < COLS; c++) {
    if (Math.random() < 0.02) grid[Math.floor(Math.random() * (ROWS-1))][c] = '·'
  }
  return grid.map(r => r.join('')).join('\n')
}

function makeForestBg(): string {
  const grid: string[][] = []
  for (let r = 0; r < ROWS; r++) grid.push(new Array(COLS).fill(' '))
  const trees = [3, 8, 15, 22, 29, 36, 42]
  for (const pos of trees) {
    if (pos < COLS) {
      grid[0][pos] = animFrame % 3 === 0 ? '*' : '|'
      grid[1][pos] = '|'
      grid[2][pos] = animFrame % 2 === 0 ? '(' : ')'
    }
  }
  const fly1 = (animFrame * 7) % COLS
  const fly2 = (animFrame * 5 + 12) % COLS
  if (fly1 < COLS) grid[4][fly1] = '·'
  if (fly2 < COLS) grid[6][fly2] = '·'
  for (let c = 0; c < COLS; c++) grid[ROWS-1][c] = '~'
  return grid.map(r => r.join('')).join('\n')
}

function makeSwampBg(): string {
  const grid: string[][] = []
  for (let r = 0; r < ROWS; r++) grid.push(new Array(COLS).fill(' '))
  const bubblePos = [4, 11, 18, 26, 33, 40]
  for (const pos of bubblePos) {
    if (pos < COLS) {
      const row = (animFrame + pos) % (ROWS - 2) + 1
      grid[row][pos] = animFrame % 3 === 0 ? 'o' : '·'
      if (row === ROWS - 2) grid[ROWS-1][pos] = '*'
    }
  }
  const fogRow = animFrame % ROWS
  for (let c = 0; c < COLS; c++) { if (Math.random() < 0.1) grid[fogRow][c] = '~' }
  for (let c = 0; c < COLS; c++) grid[ROWS-1][c] = animFrame%2===0 ? (c%4===0?'~':' ') : (c%3===0?'~':' ')
  return grid.map(r => r.join('')).join('\n')
}

function makeSparks(): string {
  const chars = [' ',' ',' ',' ',' ',' ','·','+','*','x','X','#','!']
  const lines: string[] = []
  for (let r = 0; r < ROWS; r++) {
    let line = ''
    const density = r > 3 && r < 8 ? 0.25 : 0.05
    for (let c = 0; c < COLS; c++) line += Math.random() < density ? chars[Math.floor(Math.random() * chars.length)] : ' '
    lines.push(line)
  }
  return lines.join('\n')
}

function makeSlimeDrip(): string {
  const frame = animFrame % 2
  const lines: string[] = []
  lines.push('    .~~~~~~~~~~.    ')
  lines.push('   /            \\   ')
  lines.push(frame===0 ? '  | @@        @@ |  ' : '  | /@@\\    /@@\\ |  ')
  lines.push('  |  @@      @@  |  ')
  lines.push('  |    ______    |  ')
  lines.push(frame===0 ? '  |   /      \\   |  ' : '  |   |      |   |  ')
  lines.push(frame===0 ? '  |   \\______/   |  ' : '  |   |______|   |  ')
  lines.push('   \\            /   ')
  lines.push('    `~~~~~~~~~~`    ')
  const dripLine = ' '.repeat(20).split('')
  const dripRow = animFrame % 3
  for (const col of [6, 12, 18]) { if (col < 20) dripLine[col] = dripRow===0?'|':dripRow===1?'·':'.' }
  lines.push(dripLine.join(''))
  return lines.slice(0, ROWS).join('\n')
}

function makeSkeletonAnim(): string {
  const frame = animFrame % 4
  const lines: string[] = ['                    ','        ___         ','       (o o)        ','       ( ^ )        ','      __|_|__       ']
  if (frame < 2) { lines.push('     /|||||         '); lines.push('    //|||||  -->>   ') }
  else           { lines.push('      |||||\\        '); lines.push('   <<-- |||||\\      ') }
  lines.push('      / | \\         ')
  lines.push('     /  |  \\        ')
  lines.push('    [   |   ]       ')
  return lines.slice(0, ROWS).join('\n')
}

function makeSpiderAnim(): string {
  const frame = animFrame % 4
  const lines: string[] = ['                    ','  /--\\ /--\\        ',' /    X    \\       ','|   (o o)   |      ','|    | |    |      ']
  lines.push(frame < 2 ? ' \\   _|_   /       ' : '  \\ /   \\ /        ')
  lines.push('  --     --        ')
  lines.push('  ||     ||        ')
  lines.push('  /|     |\\       ')
  lines.push('                    ')
  return lines.slice(0, ROWS).join('\n')
}

function makeWolfAnim(): string {
  const frame = animFrame % 4
  const lines: string[] = ['                    ','      /\\            ','     /  \\  _        ','    | oo | /        ','     \\--\\/          ']
  lines.push(frame < 2 ? '    /||||\\         ' : '   / |||| \\        ')
  lines.push('   /  ||  \\        ')
  lines.push('  /   ||   \\       ')
  lines.push(' [    ||    ]      ')
  lines.push('                    ')
  return lines.slice(0, ROWS).join('\n')
}

function makeTrollAnim(): string {
  const frame = animFrame % 2
  const lines: string[] = ['                    ','     _______        ','    / o   o \\       ','   |  _____  |      ','    \\_______/       ']
  lines.push(frame===0 ? '   /|||||||\\        ' : '  / ||||||| \\       ')
  lines.push('  /   |||||   \\     ')
  lines.push(' /    |||||    \\    ')
  lines.push('[     |||||     ]   ')
  lines.push('                    ')
  return lines.slice(0, ROWS).join('\n')
}

function makeBansheeAnim(): string {
  const frame = animFrame % 4
  const wave = ['~','*','~','·'][frame]
  const lines: string[] = [
    '                    ',
    '     ' + wave + ' _ _ ' + wave + '         ',
    '    / (o o) \\       ',
    '    \\ /   \\ /       ',
    '     |     |        ',
    '    / \\   / \\       ',
    '   /   \\ /   \\      ',
    '  ~     ~     ~     ',
    ' ' + wave + '             ' + wave + '    ',
    '                    ',
  ]
  return lines.slice(0, ROWS).join('\n')
}

function makeVampireAnim(): string {
  const frame = animFrame % 4
  const capeL = frame < 2 ? '/' : '\\'
  const capeR = frame < 2 ? '\\' : '/'
  const lines: string[] = [
    '                    ',
    '       ___          ',
    '      /^ ^\\         ',
    '     | v   |        ',
    '      \\___/         ',
    '    ' + capeL + '|||||' + capeR + '        ',
    '   ' + capeL + ' ||||| ' + capeR + '       ',
    '  ' + capeL + '  |||||  ' + capeR + '      ',
    ' [   |||||   ]      ',
    '                    ',
  ]
  return lines.slice(0, ROWS).join('\n')
}

function makeWraithAnim(): string {
  const frame = animFrame % 6
  const lines: string[] = [
    '                    ',
    '    . ~ ~ ~ .       ',
    '   / (o   o) \\      ',
    '  |   -----   |     ',
    '   \\         /      ',
    '    ~~ | | ~~       ',
    '      ~| |~         ',
    frame < 3 ? '       ~|~          ' : '        ~           ',
    '                    ',
    '                    ',
  ]
  return lines.slice(0, ROWS).join('\n')
}

function makeHydraAnim(): string {
  const frame = animFrame % 4
  const head1 = frame < 2 ? '(o)' : '(O)'
  const head2 = frame < 2 ? '(O)' : '(o)'
  const lines: string[] = [
    '                    ',
    '  ' + head1 + '   ' + head2 + '         ',
    '   \\ | | /          ',
    '    \\|||/           ',
    '    /|||\\           ',
    '   / | | \\          ',
    '  /  | |  \\         ',
    ' [   | |   ]        ',
    '     | |            ',
    '   ~~   ~~          ',
  ]
  return lines.slice(0, ROWS).join('\n')
}

function makeDeathKnightAnim(): string {
  const frame = animFrame % 2
  const lines: string[] = [
    '      /\\            ',
    '     /|\\            ',
    '    / | \\           ',
    '   |-----|          ',
    '   | ◆◆◆ |          ',
    '   |-----|          ',
    frame===0 ? '  /|||||||\\         ' : ' / ||||||| \\        ',
    ' /   |||||   \\      ',
    '[    |||||    ]     ',
    '                    ',
  ]
  return lines.slice(0, ROWS).join('\n')
}

function makeGargoyleAnim(): string {
  const frame = animFrame % 4
  const stoned = gargoyleStoned
  const lines: string[] = [
    '                    ',
    stoned ? '     _____          ' : '    /\\   /\\         ',
    stoned ? '    |     |         ' : '   /  \\ /  \\        ',
    stoned ? '    | . . |         ' : '  | (o) (o) |       ',
    stoned ? '    |  -  |         ' : '  |   ___   |       ',
    stoned ? '    |_____|         ' : '   \\_______/        ',
    stoned ? '   /|     |\\        ' : '   /|||||||\\        ',
    stoned ? '  / |     | \\       ' : '  / ||||||| \\       ',
    stoned ? ' [  |_____|  ]      ' : ' [  |||||   ]       ',
    '                    ',
  ]
  return lines.slice(0, ROWS).join('\n')
}

function makeNecromancerAnim(): string {
  const frame = animFrame % 6
  const staffTop = frame < 3 ? '✦' : '*'
  const lines: string[] = [
    '        ' + staffTop + '           ',
    '        |           ',
    '      __|__         ',
    '     /     \\        ',
    '    | (x x) |       ',
    '    |  ---  |       ',
    '     \\_____/        ',
    '    /|     |\\       ',
    '   / |     | \\      ',
    '  [  |     |  ]     ',
  ]
  return lines.slice(0, ROWS).join('\n')
}

function makeCursedKnightAnim(): string {
  const frame = animFrame % 2
  const lines: string[] = [
    '      /\\            ',
    '     /##\\           ',
    '    /####\\          ',
    '   |#----#|         ',
    '   |# ◆◆ #|         ',
    '   |#----#|         ',
    frame===0 ? '   /||||||\\         ' : '  / |||||| \\        ',
    '  /  ||||||  \\      ',
    ' [   ||||||   ]     ',
    '     $    $         ',
  ]
  return lines.slice(0, ROWS).join('\n')
}

function makeDragonAnim(): string {
  const frame = animFrame % 4
  const fireChar = ['*','!','✦','|'][frame]
  const lines: string[] = [
    '         /\\         ',
    '        /  \\        ',
    '       / /\\ \\       ',
    '  /\\  / /  \\ \\  /\\ ',
    ' /  \\/     \\/  \\/  \\',
    '|   (◆)   (◆)   |  ',
    ' \\    \\___/    /    ',
    '  \\___/|||\\___/     ',
    '       |||          ',
    '  ' + fireChar + fireChar + fireChar + '  |||  ' + fireChar + fireChar + fireChar + '      ',
  ]
  return lines.slice(0, ROWS).join('\n')
}

function makeShadowLord(): string {
  const frame = animFrame % 6
  const lines: string[] = [
    '                    ',
    '      /\\  /\\        ',
    '     /  \\/  \\       ',
    '    | ' + (frame < 3 ? '◆◆' : '  ') + '    |       ',
    '    |   __   |      ',
    '     \\ /  \\ /       ',
    '      |    |        ',
    '     /|    |\\       ',
    '    / |    | \\      ',
    '   [  ~~~~~~  ]     ',
  ]
  return lines.slice(0, ROWS).join('\n')
}

function makeSparkles(): string {
  const burst = ['✦','*','+','·',' ',' ',' ',' ',' ']
  const lines: string[] = []
  const cx = Math.floor(COLS/2), cy = Math.floor(ROWS/2)
  for (let r = 0; r < ROWS; r++) {
    let line = ''
    for (let c = 0; c < COLS; c++) {
      const dist = Math.abs(r-cy) + Math.abs(c-cx)
      const wave = (dist + animFrame) % 8
      line += (wave < 2 && Math.random() > 0.4) ? burst[Math.floor(Math.random()*burst.length)] : ' '
    }
    lines.push(line)
  }
  return lines.join('\n')
}

function makeDarkness(): string {
  const darkTop = Math.floor((animFrame % (ROWS*2)) / 2)
  const lines: string[] = []
  for (let r = 0; r < ROWS; r++) {
    if (r < darkTop || ROWS-1-r < darkTop) { lines.push('█'.repeat(COLS)); continue }
    let line = ''
    for (let c = 0; c < COLS; c++) {
      if (c < darkTop || COLS-1-c < darkTop) line += '█'
      else line += Math.random() > 0.97 ? '·' : ' '
    }
    lines.push(line)
  }
  return lines.join('\n')
}

function makeCelebration(): string {
  const lines: string[] = []
  const frame = animFrame % 20
  const gemRow = frame < 10 ? frame : 10
  const gemCol = 10
  const sparkleChance = frame < 10 ? 0.03 : 0.12
  const sparkles = ['✦','*','+','·',' ',' ',' ']
  for (let r = 0; r < ROWS; r++) {
    let line = ''
    for (let c = 0; c < COLS; c++) {
      if (r===gemRow && c===gemCol) line += '◆'
      else if (r===gemRow && Math.abs(c-gemCol)===1 && frame>=10) line += '*'
      else if (Math.abs(r-gemRow)===1 && c===gemCol && frame>=10) line += '|'
      else if (r===gemRow && Math.abs(c-gemCol)===2 && frame>=10) line += '-'
      else if (frame<10 && r<gemRow && r>gemRow-3 && c===gemCol) line += '·'
      else line += Math.random()<sparkleChance ? sparkles[Math.floor(Math.random()*sparkles.length)] : ' '
    }
    lines.push(line)
  }
  if (frame===10||frame===11) lines[gemRow] = ' '.repeat(gemCol-3)+'* ◆◆◆ *'+' '.repeat(COLS-gemCol-4)
  if (frame>=12) lines[ROWS-1] = '~'.repeat(COLS)
  return lines.slice(0, ROWS).join('\n')
}

function makeCharSelectAnim(): string {
  const shape = SHAPES[shapeIndex]
  const cx = Math.floor(COLS/2), cy = Math.floor(ROWS/2)
  const lines: string[] = []
  for (let r = 0; r < ROWS; r++) {
    let line = ''
    for (let c = 0; c < COLS; c++) {
      if (r===cy && c===cx) line += shape
      else if ((r===cy && Math.abs(c-cx)===2) || (r===cy-1 && c===cx) || (r===cy+1 && c===cx)) line += animFrame%4<2?'·':' '
      else line += ' '
    }
    lines.push(line)
  }
  return lines.join('\n')
}

function makeUpgradeAnim(): string {
  const lines: string[] = []
  for (let r = 0; r < ROWS; r++) {
    let line = ''
    for (let c = 0; c < COLS; c++) {
      const wave = (r + c + animFrame) % 12
      line += wave < 2 ? ['✦','*','+'][Math.floor(Math.random()*3)] : ' '
    }
    lines.push(line)
  }
  return lines.join('\n')
}

function makeFoundAnim(): string {
  const lines: string[] = []
  const cx = Math.floor(COLS / 2)
  for (let r = 0; r < ROWS; r++) {
    const line = new Array(COLS).fill(' ')
    if (r === 4) { const star = animFrame%2===0?'*':'✦'; line[cx-2]=star; line[cx]='!'; line[cx+2]=star }
    if (r === 5) { line[cx-1]='('; line[cx]='?'; line[cx+1]=')' }
    if (r === 6) { const pos=(animFrame*3)%(COLS-4)+2; line[pos]='·' }
    lines.push(line.join(''))
  }
  return lines.join('\n')
}

function getAnimation(name: Screen): string {
  const eid = getActiveEnemyId()
  const inDungeon = questPhase >= 30 && questPhase <= 59
  switch (name) {
    case 'title': case 'help':                                       return makeStars()
    case 'charSelect':                                               return makeCharSelectAnim()
    case 'upgrade': case 'secretUpgrade':                            return makeUpgradeAnim()
    case 'merchant': case 'merchantMsg':                             return makeCoin()
    case 'swampShop': case 'swampShopMsg':                           return makeCoin()
    case 'dungeonShop': case 'dungeonShopMsg':                       return makeCoin()
    case 'foundItem':                                                return makeFoundAnim()
    case 'bram1': case 'bram2': case 'bramAccepted': case 'bramReward':   return makeTorch('Elder Bram')
    case 'title1Earned':                                             return makeCelebration()
    case 'greta1': case 'greta2': case 'gretaAccepted': case 'gretaReward': return makeTorch('Greta')
    case 'title2Earned':                                             return makeCelebration()
    case 'aria1': case 'aria2': case 'ariaAccepted': case 'ariaReward':   return makeTorch('Aria')
    case 'title3Earned':                                             return makeCelebration()
    case 'gareth1': case 'gareth2': case 'garethAccepted': case 'garethReward': return makeTorch('Gareth')
    case 'title4Earned':                                             return makeCelebration()
    case 'thorin1': case 'thorin2': case 'thorinAccepted': case 'thorinReward': return makeTorch('Thorin')
    case 'title5Earned':                                             return makeCelebration()
    case 'lyra1': case 'lyra2': case 'lyraAccepted': case 'lyraReward':   return makeTorch('Lyra')
    case 'title6Earned':                                             return makeCelebration()
    case 'dorin1': case 'dorin2': case 'dorinAccepted': case 'dorinReward': return makeTorch('Dorin')
    case 'title7Earned':                                             return makeCelebration()
    case 'mira1': case 'mira2': case 'miraAccepted': case 'miraReward':   return makeTorch('Mira')
    case 'mira3': case 'mira4': case 'mira2Accepted': case 'mira2Reward': return makeTorch('Mira')
    case 'title8Earned': case 'title9Earned':                        return makeCelebration()
    case 'zane1': case 'zane2': case 'zaneAccepted': case 'zaneReward':   return makeTorch('Elder Zane')
    case 'title10Earned':                                            return makeCelebration()
    case 'rook1': case 'rook2': case 'rookAccepted': case 'rookReward':   return makeTorch('Rook')
    case 'rook3': case 'rook4': case 'rook2Accepted': case 'rook2Reward': return makeTorch('Rook')
    case 'title11Earned': case 'title12Earned':                      return makeCelebration()
    case 'vera1': case 'vera2': case 'veraAccepted': case 'veraReward':   return makeTorch('Vera')
    case 'vera3': case 'vera4': case 'vera2Accepted': case 'vera2Reward': return makeTorch('Vera')
    case 'vera5': case 'vera6': case 'vera3Accepted': case 'vera3Reward': return makeTorch('Vera')
    case 'title13Earned': case 'title14Earned': case 'title15Earned': return makeCelebration()
    case 'moss1': case 'moss2': case 'mossAccepted': case 'mossReward':   return makeTorch('Elder Moss')
    case 'moss3': case 'moss4': case 'moss2Accepted': case 'moss2Reward': return makeTorch('Elder Moss')
    case 'moss5': case 'moss6': case 'moss3Accepted': case 'moss3Reward': return makeTorch('Elder Moss')
    case 'title16Earned': case 'title17Earned': case 'title18Earned': return makeCelebration()
    case 'thane1': case 'thane2': case 'thaneAccepted': case 'thaneReward':   return makeTorch('Thane')
    case 'thane3': case 'thane4': case 'thane2Accepted': case 'thane2Reward': return makeTorch('Thane')
    case 'title19Earned': case 'title20Earned':                      return makeCelebration()
    case 'trollGreet':                                               return makeTrollAnim()
    case 'bossGreet': case 'bossVictory': case 'bossReward':         return makeShadowLord()
    case 'combat': case 'combatMenu': case 'fleeConfirm':
      if (isBossFight) return makeLightning()
      if (eid === 1)   return makeDrips()
      if (eid === 2)   return makeDungeon()
      if (eid >= 12)   return makeDungeonBg()
      if (eid >= 9)    return makeSwampBg()
      return makeForestBg()
    case 'playerHit': case 'playerMiss':
    case 'playerDefend': case 'playerDefendFail':
    case 'playerPower': case 'playerPowerMiss':
      return isBossFight ? makeLightning() : makeSparks()
    case 'enemyAttack':
      if (isBossFight) return makeLightning()
      if (eid === 1)   return makeSlimeDrip()
      if (eid === 2)   return makeSkeletonAnim()
      if (eid === 3)   return makeSpiderAnim()
      if (eid === 4)   return makeWolfAnim()
      if (eid === 5)   return makeTrollAnim()
      if (eid === 7)   return makeBansheeAnim()
      if (eid === 8)   return makeVampireAnim()
      if (eid === 9)   return makeWraithAnim()
      if (eid === 10)  return makeHydraAnim()
      if (eid === 11)  return makeDeathKnightAnim()
      if (eid === 12 || eid === 15) return makeGargoyleAnim()
      if (eid === 13 || eid === 16) return makeNecromancerAnim()
      if (eid === 14 || eid === 17) return makeCursedKnightAnim()
      return makeDragonAnim()
    case 'victory':   return makeSparkles()
    case 'dead':      return makeDarkness()
    default:          return makeStars()
  }
}

// ═══════════════════════════════════════
// FLAVOR TEXT
// ═══════════════════════════════════════

const playerAttacks     = ['You slash!','Your blade connects!','A solid hit!','You lunge!','Strike hard!']
const playerMisses      = ['It dodges!','Blade whiffs!','You stumble!','A clumsy miss!']
const playerDefends     = ['Guard up!','You brace!','Shield up!','You deflect!']
const playerDefendFails = ['Guard breaks!','Blow gets past!','Defense failed!']
const playerPowers      = ['POWER STRIKE!','Fury unleashed!','Critical hit!','Devastating blow!']
const playerPowerMisses = ['Too slow!','Power wasted!','You overswing!']
const slimeAttacks      = ['Slime lunges!','It squelches!','Acid splashes!','Slime surges!']
const slimeRetaliates   = ['Slime surges back!','Acid burst!','Slime revenge!']
const skelAttacks       = ['Bones rattle!','Bony slash!','It charges!']
const skelRageAttacks   = ['ENRAGED!','Bones fly!','Rattling rage!']
const spiderAttacks     = ['Fangs lunge!','Eight legs!','Silk spit!']
const spiderPoisons     = ['Venom injected!','Toxic bite!','Poison courses!']
const wolfAttacks       = ['It howls!','Claws rip!','Fangs snap!']
const wolfDoubleAttacks = ['Claw then bite!','Two swift strikes!']
const trollAttacks      = ['Ground shakes!','Mighty swing!','It roars!']
const trollSlam         = ['SLAM! 2 damage!','Crushing blow!']
const trollChargeTurns  = ['Troll crouches...','Gathering strength...']
const bansheeAttacks    = ['Piercing shriek!','Ghost scream!','Wail strikes!']
const bansheeStuns      = ['STUNNED! Wail echoes!','Scream stuns you!']
const vampireAttacks    = ['Fangs sink in!','Life drain!','Cold bite!']
const wraithAttacks     = ['Ghostly claws!','Cold touch!','Dark grasp!']
const wraithPoisons     = ['Bog curse!','Swamp poison!','Dark venom!']
const hydraAttacks      = ['Two heads strike!','Hydra snaps!','Twin fangs!']
const knightAttacks     = ['Heavy sword!','Armored slam!','Death blow!']
const gargoyleAttacks   = ['Stone fist!','Rocky slam!','Gargoyle strikes!']
const gargoyleTurns     = ['Turns to stone!','Stone form!','Rock solid!']
const necroAttacks      = ['Dark spell!','Bone magic!','Shadow bolt!']
const necroRevives      = ['IT RISES AGAIN!','Back from death!','Refuses to die!']
const cursedKnightAtks  = ['Gold stolen!','Cursed blade!','Coins stolen!']
const dragonAttacks     = ['Dragon claws!','Tail swipe!','Wing slam!']
const dragonFire        = ['FIRE BREATH! 3dmg!','Inferno blast!','Flame ignores shield!']
const bossAttacks1      = ['Shadow tendrils!','A dark bolt!','Shadow claws!']
const bossAttacks2      = ['DARK SURGE!','Fury of darkness!','Double strike!']
const bossAttacks3      = ['DESPERATE STRIKE!','Final fury!','Shadow explosion!']
const bossShieldRaise   = ['Shadow shield!','Shield appears!','Boss shields up!']

function randomFrom(arr: string[]): string { return arr[Math.floor(Math.random() * arr.length)] }
// ═══════════════════════════════════════
// VALID INPUTS
// ═══════════════════════════════════════

const validInputs: Record<Screen, number[]> = {
  title:          [0, 1, 3],
  help:           [0],
  charSelect:     [0, 1, 2],
  upgrade:        [0, 1],
  secretUpgrade:  [0, 1],
  explore:        [0, 1, 2, 3],
  forestExplore:  [0, 1, 2, 3],
  swampExplore:   [0, 1, 2, 3],
  dungeonExplore: [0, 1, 2, 3],
  merchant:       [0, 1, 2, 3],
  merchantMsg:    [0],
  swampShop:      [0, 1],
  swampShopMsg:   [0],
  dungeonShop:    [0, 1],
  dungeonShopMsg: [0],
  foundItem:      [0],
  bram1:[0], bram2:[0], bramAccepted:[0], bramReward:[0], title1Earned:[0],
  greta1:[0], greta2:[0], gretaAccepted:[0], gretaReward:[0], title2Earned:[0],
  aria1:[0], aria2:[0], ariaAccepted:[0], ariaReward:[0], title3Earned:[0],
  gareth1:[0], gareth2:[0], garethAccepted:[0], garethReward:[0], title4Earned:[0],
  thorin1:[0], thorin2:[0], thorinAccepted:[0], thorinReward:[0], title5Earned:[0],
  lyra1:[0], lyra2:[0], lyraAccepted:[0], lyraReward:[0], title6Earned:[0],
  dorin1:[0], dorin2:[0], dorinAccepted:[0], dorinReward:[0], title7Earned:[0],
  mira1:[0], mira2:[0], miraAccepted:[0], miraReward:[0], title8Earned:[0],
  mira3:[0], mira4:[0], mira2Accepted:[0], mira2Reward:[0], title9Earned:[0],
  zane1:[0], zane2:[0], zaneAccepted:[0], zaneReward:[0], title10Earned:[0],
  rook1:[0], rook2:[0], rookAccepted:[0], rookReward:[0], title11Earned:[0],
  rook3:[0], rook4:[0], rook2Accepted:[0], rook2Reward:[0], title12Earned:[0],
  vera1:[0], vera2:[0], veraAccepted:[0], veraReward:[0], title13Earned:[0],
  vera3:[0], vera4:[0], vera2Accepted:[0], vera2Reward:[0], title14Earned:[0],
  vera5:[0], vera6:[0], vera3Accepted:[0], vera3Reward:[0], title15Earned:[0],
  moss1:[0], moss2:[0], mossAccepted:[0], mossReward:[0], title16Earned:[0],
  moss3:[0], moss4:[0], moss2Accepted:[0], moss2Reward:[0], title17Earned:[0],
  moss5:[0], moss6:[0], moss3Accepted:[0], moss3Reward:[0], title18Earned:[0],
  thane1:[0], thane2:[0], thaneAccepted:[0], thaneReward:[0], title19Earned:[0],
  thane3:[0], thane4:[0], thane2Accepted:[0], thane2Reward:[0], title20Earned:[0],
  trollGreet:[0], bossGreet:[0], bossVictory:[0], bossReward:[0],
  combat:         [0, 1, 2, 3],
  combatMenu:     [0, 1, 2],
  fleeConfirm:    [0, 2],
  playerHit:[0], playerMiss:[0],
  playerDefend:[0], playerDefendFail:[0],
  playerPower:[0], playerPowerMiss:[0],
  enemyAttack:[0], victory:[0], dead:[0],
}

// ═══════════════════════════════════════
// SCREEN TEXT
// ═══════════════════════════════════════

function getMerchantScreenText(): string {
  const item = SHOP_ITEMS[merchantItemIndex]
  const isPotion = item.key === 'potion'
  const owned = isPotion ? potionCount >= getPotionMax() : getItemOwned(item.key)
  const full = !isPotion && inventoryCount() >= 5 && !owned
  const canAfford = playerGold >= item.price
  let status = ''
  if (isPotion && potionCount >= getPotionMax()) status = 'FULL (' + getPotionMax() + '/' + getPotionMax() + ')'
  else if (isPotion)   status = item.price + 'g  POT:' + potionCount + '/' + getPotionMax()
  else if (owned)      status = 'OWNED'
  else if (full)       status = 'BAG FULL'
  else if (!canAfford) status = 'Need ' + item.price + 'g'
  else                 status = item.price + 'g - BUY?'
  return [
    ' MERCHANT', '---------',
    ' Gold: ' + playerGold + '  (' + inventoryCount() + '/5)', '',
    ' ' + (merchantItemIndex + 1) + '/9 ' + item.name,
    ' ' + item.desc, ' ' + status,
    ' [^][v] Browse',
    ' [Tap] Buy  [Dbl] Exit',
  ].join('\n')
}

function getSwampShopText(): string {
  const owned = hasSoulStone
  const full = inventoryCount() >= 5 && !owned
  const canAfford = playerGold >= 80
  let status = owned ? 'OWNED' : full ? 'BAG FULL' : !canAfford ? 'Need 80g' : '80g - BUY?'
  return [
    ' CURSED SHOP', '------------',
    ' Gold: ' + playerGold, '',
    ' Soul Stone',
    ' Power recharges',
    ' after each kill!',
    ' ' + status,
    ' [Tap] Buy  [Sw up] Exit',
  ].join('\n')
}

function getDungeonShopText(): string {
  const owned = hasCursedBlade
  const full = inventoryCount() >= 5 && !owned
  const canAfford = playerGold >= 90
  let status = owned ? 'OWNED' : full ? 'BAG FULL' : !canAfford ? 'Need 90g' : '90g - BUY?'
  return [
    ' DARK FORGE', '-----------',
    ' Gold: ' + playerGold, '',
    ' Cursed Blade',
    ' +3 ATK always!',
    ' -1 HP per fight',
    ' ' + status,
    ' [Tap] Buy  [Sw up] Exit',
  ].join('\n')
}

function getScreenText(name: Screen): string {
  const enemy = getCurrentEnemy()
  const n = charName
  const saveExists = hasSave()
  const hasAnyShield = hasShield || hasDragonShield || shapeIndex === 2
  const hasAnyBow    = hasBow || hasEnchantedBow
  const shieldStatus = bossShielded ? ' [SHLD]' : ''
  const gargStatus   = gargoyleStoned ? ' [STONE]' : ''
  const statusLine = '♥'.repeat(Math.max(0, playerHP)) +
    (poisoned ? ' PSN' : '') + (trollCharging ? ' CHG' : '') +
    (bansheeStunned ? ' STN' : '') +
    (hasAnyShield ? ' [Sh]' : '') + (hasAnyBow ? ' [Bo]' : '') +
    (tempAtkBonus > 0 ? ' [+Sw]' : '') + (tempLucky ? ' [Lk]' : '') +
    (shapeIndex === 4 ? ' [Di]' : '') + (shapeIndex === 5 ? ' [Cl]' : '')
  const enemyLine = '█'.repeat(Math.max(0, enemyCurrentHP)) +
    (enemyCurrentHP <= 1 && questPhase <= 5 && !isBossFight ? ' ENRAGED' : '') +
    (isBossFight ? shieldStatus + ' P' + getBossPhase() : '') +
    (!isBossFight && (getActiveEnemyId() === 12 || getActiveEnemyId() === 15) ? gargStatus : '')

  switch (name) {
    case 'title': return [
      ' WANDERERS PATH','---------------','', ' A Bit Adventure','','',
      saveExists ? ' [Tap] New Game'   : ' [Tap] Begin',
      saveExists ? ' [Sw up] Continue' : '',
      ' [Dbl] Help',
    ].join('\n')

    case 'help': return [
      ' CONTROLS','--------','',
      ' Map:',
      ' Tap = Move right',
      ' Dbl = Move left',
      ' Sw up = Move up',
      ' Sw dn = Move down',
      ' Combat:',
      ' Tap=Attack Dbl=Power',
      ' Sw dn=Defend',
      ' Sw up=Menu(Pot/Flee)',
      ' [Tap] Back',
    ].join('\n')

    case 'charSelect': {
      const passives = ['Balanced','Tank: +2 HP','Defender: dodge+','Attacker: +1 ATK','Lucky: 2x dmg 20%','Cleric: self heal']
      return [
        ' CHOOSE HERO','------------','',
        ' ' + SHAPES[shapeIndex] + '  ' + SHAPE_NAMES[shapeIndex],
        ' ' + passives[shapeIndex],
        ' [Sw up] Next',' [Sw dn] Previous','', ' [Tap] Select!',
      ].join('\n')
    }

    case 'upgrade': return [
      ' LEVEL UP!','----------',' Choose upgrade:','',
      ' [Tap]',' +1 Attack power','', ' [Sw up]',' +1 Max HP',
    ].join('\n')

    case 'secretUpgrade': return [
      ' HERMIT SAGE','------------','',
      ' "Wanderer! I have',
      ' awaited you."',
      ' "Take this gift!"',
      '',
      ' [Tap] +1 ATK',
      ' [Sw up] +1 Max HP',
    ].join('\n')

    case 'merchant':        return getMerchantScreenText()
    case 'merchantMsg':     return [' MERCHANT','---------','',' '+merchantMessage,'',' Gold: '+playerGold,' Bag: '+inventoryCount()+'/5','',' [Tap] Back'].join('\n')
    case 'swampShop':       return getSwampShopText()
    case 'swampShopMsg':    return [' CURSED SHOP','------------','',' '+swampShopMessage,'',' Gold: '+playerGold,'',' [Tap] Back'].join('\n')
    case 'dungeonShop':     return getDungeonShopText()
    case 'dungeonShopMsg':  return [' DARK FORGE','-----------','',' '+dungeonShopMessage,'',' Gold: '+playerGold,'',' [Tap] Back'].join('\n')
    case 'foundItem':       return [' FOUND!','-------','',...foundItemMessage.split('\n'),'',' [Tap] Continue'].join('\n')

    // ── MILLHAVEN NPCs ──────────────────
    case 'bram1': {
      const sc: Record<number,string> = {0:'"A Triangle!"',1:'"Round hero!"',2:'"A Square!"',3:'"A Star?!"',4:'"A Diamond!"',5:'"A holy hero!"'}
      return [' ELDER BRAM','-----------','', ' '+( sc[shapeIndex]||'"A hero!"'),' "A cave slime stole',' our Hearthstone!',' I may have left it',' unattended. Oops."',' [Tap] Next'].join('\n')
    }
    case 'bram2':         return [' ELDER BRAM','-----------','',' "The slime is east.',' Very slimy. And',' smelly. Mostly',' slimy though. Go!"',' [Tap] Accept'].join('\n')
    case 'bramAccepted':  return [' QUEST 1','--------','', ' Retrieve the',' Hearthstone.',' Head east to C.',' (Bram says sorry)',' [Tap] Continue'].join('\n')
    case 'bramReward':    return [' ELDER BRAM','-----------','',' "YOU DID IT! Ahem.',' Well done '+n+'.',' Very heroic.',' Very slimy.',' Have a title."',' [Tap] Next'].join('\n')
    case 'title1Earned':  return [' TITLE EARNED!','--------------','',' '+n,'',' Slime-Slayer',' of Millhaven!',' (Bram is proud)',' [Tap] Continue'].join('\n')

    case 'greta1': {
      const sc: Record<number,string> = {0:'"Triangles. Sure."',1:'"Round and ready?"',2:'"Square. Fitting."',3:'"Oh a Star. Great."',4:'"Lucky charm, eh?"',5:'"A healer. Good."'}
      return [' GRETA',' Blacksmith','-----------','',' '+(sc[shapeIndex]||'"Another hero."'),' "Skeleton stole my',' relic. Ancient',' ruins, east."',' [Tap] Next'].join('\n')
    }
    case 'greta2':        return [' GRETA',' Blacksmith','-----------','',' "Hits hard. Watch',' the sword.",', '"Go. Ruins. East."',' [Tap] Accept'].join('\n')
    case 'gretaAccepted': return [' QUEST 2','--------','', ' Defeat the',' Skeleton Warrior.',' Head to ruins R.',' Greta says good',' luck. Grudgingly.',' [Tap] Continue'].join('\n')
    case 'gretaReward':   return [' GRETA',' Blacksmith','-----------','',' "Hm. You did it.',' Fine. Here is',' a title. Don\'t',' let it go to',' your head."',' [Tap] Next'].join('\n')
    case 'title2Earned':  return [' TITLE EARNED!','--------------','',' '+n,'',' Bone-Breaker',' of the Ruins!',' (Greta approves.',' Barely.) [Tap]'].join('\n')

    case 'aria1': {
      const sc: Record<number,string> = {0:'"Ooh a Triangle!"',1:'"Wow so round!"',2:'"A Square hero!"',3:'"A STAR! Amazing!"',4:'"Oh sparkly!"',5:'"A healer! Yes!"'}
      return [' ARIA',' Ranger','-----------','',' '+(sc[shapeIndex]||'"A hero!"'),' "A Giant Spider',' moved into den S!',' It is SO big!"',' [Tap] Next'].join('\n')
    }
    case 'aria2':         return [' ARIA',' Ranger','-----------','',' "Eight legs! Eight!',' And venom! Lots!',' I tried to shoo',' it away. Failed.',' Please go!"',' [Tap] Accept'].join('\n')
    case 'ariaAccepted':  return [' QUEST 3','--------','', ' Defeat the',' Giant Spider.',' Head to S!',' Aria is rooting',' for you! Loudly.',' [Tap] Continue'].join('\n')
    case 'ariaReward':    return [' ARIA',' Ranger','-----------','',' "YOU DID IT!!!"',' "I watched from',' a very safe',' distance. Very',' safe. Bye!"',' [Tap] Next'].join('\n')
    case 'title3Earned':  return [' TITLE EARNED!','--------------','',' '+n,'',' Spider-Slayer',' of the Forest!',' (Aria screamed',' with joy) [Tap]'].join('\n')

    case 'gareth1': {
      const sc: Record<number,string> = {0:'"Triangle. Good."',1:'"Circle. Strong."',2:'"Square. Sturdy."',3:'"Star. Flashy."',4:'"Diamond. Lucky."',5:'"Cross. Handy."'}
      return [' GARETH',' Hunter','-----------','',' '+(sc[shapeIndex]||'"You\'ll do."'),' "Werewolf. Dark',' clearing. Big.',' Mean. Fast."',' [Tap] Next'].join('\n')
    }
    case 'gareth2':        return [' GARETH',' Hunter','-----------','',' "It bit my hat.',' My FAVOURITE hat.',' Clearing W. Go."',' "Watch the claws."',' [Tap] Accept'].join('\n')
    case 'garethAccepted': return [' QUEST 4','--------','', ' Defeat the',' Werewolf at W.',' Avenge the hat.',' [Tap] Continue'].join('\n')
    case 'garethReward':   return [' GARETH',' Hunter','-----------','',' "Good work.',' My hat is avenged.',' Title. Don\'t lose',' it. Or your hat."',' [Tap] Next'].join('\n')
    case 'title4Earned':   return [' TITLE EARNED!','--------------','',' '+n,'',' Wolf-Bane',' of the Forest!',' (The hat is at',' peace.) [Tap]'].join('\n')

    case 'thorin1': {
      const sc: Record<number,string> = {0:'"Hail, Triangle!"',1:'"Hail, Circle!"',2:'"Hail, Square!"',3:'"Hail, Star!"',4:'"Hail, Diamond!"',5:'"Hail, Cross!"'}
      return [' THORIN',' Dwarf Elder','-----------','',' '+(sc[shapeIndex]||'"Hail!"'),' "A Troll has',' claimed our bridge!',' It ate my lunch."',' [Tap] Next'].join('\n')
    }
    case 'thorin2':        return [' THORIN',' Dwarf Elder','-----------','',' "Bridge is at L.',' Troll is large',' and smells of',' old cheese."',' [Tap] Accept'].join('\n')
    case 'thorinAccepted': return [' QUEST 5','--------','', ' Defeat the Troll',' at bridge L.',' For the bridge.',' For the lunch.',' [Tap] Continue'].join('\n')
    case 'thorinReward':   return [' THORIN',' Dwarf Elder','-----------','',' "Bridge is OURS!',' Also the Troll',' had my lunch.',' It was gone. Sad."',' [Tap] Next'].join('\n')
    case 'title5Earned':   return [' TITLE EARNED!','--------------','',' '+n,'',' Troll-Crusher',' of the Bridge!',' (Lunch unrecovered',' RIP) [Tap]'].join('\n')

    case 'lyra1': {
      const sc: Record<number,string> = {0:'"Ah. A Triangle.',1:'"Ah. A Circle.',2:'"Ah. A Square.',3:'"Ah. A Star.',4:'"Ah. A Diamond.',5:'"Ah. A Cross.'}
      return [' LYRA',' Forest Witch','-----------','',' '+(sc[shapeIndex]||'"Ah. A hero.')+' Interesting."',' "A Banshee wails',' in grove N. Its',' scream stuns you."',' [Tap] Next'].join('\n')
    }
    case 'lyra2':        return [' LYRA',' Forest Witch','-----------','',' "I would go but',' the wailing ruins',' my focus. Very',' disruptive. Go."',' [Tap] Accept'].join('\n')
    case 'lyraAccepted': return [' QUEST 6','--------','', ' Defeat the',' Banshee at N.',' Its scream stuns',' your next attack.',' [Tap] Continue'].join('\n')
    case 'lyraReward':   return [' LYRA',' Forest Witch','-----------','',' "Silence at last.',' You did well, '+n+'.',' For a '+SHAPE_NAMES[shapeIndex]+'."',' [Tap] Next'].join('\n')
    case 'title6Earned': return [' TITLE EARNED!','--------------','',' '+n,'',' Banshee-Silencer',' of the Grove!',' (Lyra can focus',' again.) [Tap]'].join('\n')

    case 'dorin1': {
      const sc: Record<number,string> = {0:'"A Triangle faces',1:'"A Circle faces',2:'"A Square faces',3:'"A Star faces',4:'"A Diamond faces',5:'"A Cross faces'}
      return [' DORIN',' Shadow Hunter','-----------','',' '+(sc[shapeIndex]||'"A hero faces')+' darkness..."',' "Vampire lurks',' in hollow V.',' Drains to heal!"',' [Tap] Next'].join('\n')
    }
    case 'dorin2':        return [' DORIN',' Shadow Hunter','-----------','',' "I tracked it',' for weeks! Very',' dramatically.',' NOW YOU GO. Go!"',' [Tap] Accept'].join('\n')
    case 'dorinAccepted': return [' QUEST 7','--------','', ' Defeat the',' Vampire at V.',' It heals when',' it hits you!',' [Tap] Continue'].join('\n')
    case 'dorinReward':   return [' DORIN',' Shadow Hunter','-----------','',' "The darkness...',' is lifted. Great',' work, '+n+'!',' The swamp awaits.',' Dun dun."',' [Tap] Next'].join('\n')
    case 'title7Earned':  return [' TITLE EARNED!','--------------','',' '+n,'',' Vampire-Slayer',' of the Hollow!',' (Dorin is VERY',' dramatic.) [Tap]'].join('\n')

    case 'mira1': {
      const sc: Record<number,string> = {0:'"Oh a Triangle!',1:'"Oh a Circle!',2:'"Oh a Square!',3:'"Oh a Star!',4:'"Oh a Diamond!',5:'"Oh a Cross!'}
      return [' MIRA',' Swamp Guide','-----------','',' '+(sc[shapeIndex]||'"Oh a hero!')+' Welcome!"',' "Bog Wraith is',' scaring my frogs',' at W!"',' [Tap] Next'].join('\n')
    }
    case 'mira2':        return [' MIRA',' Swamp Guide','-----------','',' "MY bog frogs!',' Please go deal',' with it at W!"',' [Tap] Accept'].join('\n')
    case 'miraAccepted': return [' QUEST 8','--------','', ' Defeat the',' Bog Wraith at W.',' May poison you.',' [Tap] Continue'].join('\n')
    case 'miraReward':   return [' MIRA',' Swamp Guide','-----------','',' "Frogs are happy!',' You are the best,',' '+n+'! Now about',' that Hydra at H..."',' [Tap] Next'].join('\n')
    case 'title8Earned': return [' TITLE EARNED!','--------------','',' '+n,'',' Wraith-Walker',' of the Swamp!',' (Frogs rejoice)',' [Tap] Continue'].join('\n')

    case 'mira3':        return [' MIRA',' Swamp Guide','-----------','',' "So. The Hydra.',' Two heads. Rude.',' It ate my boat.',' It regrows! Rude!"',' [Tap] Next'].join('\n')
    case 'mira4':        return [' MIRA',' Swamp Guide','-----------','',' "Head to H!',' Hit it once and',' it comes back!',' Hit it AGAIN."',' [Tap] Accept'].join('\n')
    case 'mira2Accepted':return [' QUEST 9','--------','', ' Defeat the',' Swamp Hydra H.',' Regrows once to',' 2 HP. Hit twice!',' [Tap] Continue'].join('\n')
    case 'mira2Reward':  return [' MIRA',' Swamp Guide','-----------','',' "BOTH HEADS GONE!',' Boat still eaten',' but still! Find',' Zane now, '+n+'!"',' [Tap] Next'].join('\n')
    case 'title9Earned': return [' TITLE EARNED!','--------------','',' '+n,'',' Hydra-Breaker',' of the Pool!',' (Boat still gone',' RIP) [Tap]'].join('\n')

    case 'zane1': {
      const sc: Record<number,string> = {0:'"Ah yes. Triangle.',1:'"Ah yes. Circle.',2:'"Ah yes. Square.',3:'"Ah yes. Star.',4:'"Ah yes. Diamond.',5:'"Ah yes. Cross.'}
      return [' ELDER ZANE',' Swamp Elder','-----------','',' '+(sc[shapeIndex]||'"Ah yes. Hero.')+' I remember."',' "Death Knight.',' Bridge K. Hits',' for 2 every turn."',' [Tap] Next'].join('\n')
    }
    case 'zane2':        return [' ELDER ZANE',' Swamp Elder','-----------','',' "I fought it once.',' Long ago. Or was',' it Tuesday? Go.',' I will nap."',' [Tap] Accept'].join('\n')
    case 'zaneAccepted': return [' QUEST 10','--------','', ' Defeat the',' Death Knight K.',' 2 damage always.',' Zane is napping.',' [Tap] Continue'].join('\n')
    case 'zaneReward':   return [' ELDER ZANE',' Swamp Elder','-----------','',' "Hmm? Oh! You won!',' I dreamed of this.',' Or was that soup.',' Go face the Boss!',' Wait... Dungeon."',' [Tap] Next'].join('\n')
    case 'title10Earned':return [' TITLE EARNED!','--------------','',' '+n,'',' Knight-Crusher',' of the Bridge!',' (Zane went back',' to sleep.) [Tap]'].join('\n')

    // ── DUNGEON NPCs ────────────────────
    case 'rook1': {
      const sc: Record<number,string> = {0:'Shape: Triangle.',1:'Shape: Circle.',2:'Shape: Square.',3:'Shape: Star.',4:'Shape: Diamond.',5:'Shape: Cross.'}
      return [' ROOK',' Dungeon Scout','-----------','',' "'+n+'! Welcome',' to the dungeon."',' "'+( sc[shapeIndex]||'Interesting shape.')+' A Gargoyle',' guards gate G!"',' [Tap] Next'].join('\n')
    }
    case 'rook2':        return [' ROOK',' Dungeon Scout','-----------','',' "It turns to stone',' to block attacks.',' When stoned, your',' hits do nothing."',' [Tap] Accept'].join('\n')
    case 'rookAccepted': return [' QUEST 11','--------','', ' Defeat the',' Stone Gargoyle G.',' When stoned it',' blocks all damage.',' [Tap] Continue'].join('\n')
    case 'rookReward':   return [' ROOK',' Dungeon Scout','-----------','',' "Ha! You cracked',' the stone beast!"',' "But there is a',' Necromancer at N."',' [Tap] Next'].join('\n')
    case 'title11Earned':return [' TITLE EARNED!','--------------','',' '+n,'',' Stone-Smasher',' of the Dungeon!',' [Tap] Continue'].join('\n')

    case 'rook3':        return [' ROOK',' Dungeon Scout','-----------','',' "The Necromancer',' is at N. It dies',' and comes BACK.',' Hit it twice."',' [Tap] Next'].join('\n')
    case 'rook4':        return [' ROOK',' Dungeon Scout','-----------','',' "First death it',' revives to 6 HP.',' Second death is',' permanent. Go!"',' [Tap] Accept'].join('\n')
    case 'rook2Accepted':return [' QUEST 12','--------','', ' Defeat the',' Necromancer N.',' It revives once',' to 6 HP!',' [Tap] Continue'].join('\n')
    case 'rook2Reward':  return [' ROOK',' Dungeon Scout','-----------','',' "Twice! You killed',' it TWICE! Nice."',' "Now find Vera."',' [Tap] Next'].join('\n')
    case 'title12Earned':return [' TITLE EARNED!','--------------','',' '+n,'',' Necro-Breaker',' of the Dungeon!',' [Tap] Continue'].join('\n')

    case 'vera1': {
      const sc: Record<number,string> = {0:'Triangle warrior.',1:'Circle tank.',2:'Square defender.',3:'Star attacker.',4:'Diamond gambler.',5:'Cross healer.'}
      return [' VERA',' Dungeon Warrior','-----------','',' "'+n+'! '+(sc[shapeIndex]||'Hero.')+'"',' "Cursed Knight K.',' Steals your gold',' on every hit!"',' [Tap] Next'].join('\n')
    }
    case 'vera2':        return [' VERA',' Dungeon Warrior','-----------','',' "No gold? It just',' does normal damage.',' Kill it fast or',' go broke!"',' [Tap] Accept'].join('\n')
    case 'veraAccepted': return [' QUEST 13','--------','', ' Defeat the',' Cursed Knight K.',' Steals 10g per hit.',' Kill it fast!',' [Tap] Continue'].join('\n')
    case 'veraReward':   return [' VERA',' Dungeon Warrior','-----------','',' "Your gold is safe!',' For now. There is',' a tougher Gargoyle',' at G. Go!"',' [Tap] Next'].join('\n')
    case 'title13Earned':return [' TITLE EARNED!','--------------','',' '+n,'',' Knight-Slayer',' of the Dungeon!',' [Tap] Continue'].join('\n')

    case 'vera3':        return [' VERA',' Dungeon Warrior','-----------','',' "Gargoyle II at G.',' Tougher than the',' last one. More',' stone. More angry."',' [Tap] Next'].join('\n')
    case 'vera4':        return [' VERA',' Dungeon Warrior','-----------','',' "Same deal - wait',' out the stone form',' then hit it hard."',' [Tap] Accept'].join('\n')
    case 'vera2Accepted':return [' QUEST 14','--------','', ' Defeat the',' Gargoyle II at G.',' Wait out stone',' form then attack.',' [Tap] Continue'].join('\n')
    case 'vera2Reward':  return [' VERA',' Dungeon Warrior','-----------','',' "Another one down!',' Now Necromancer II',' at N. Stronger',' than the last!"',' [Tap] Next'].join('\n')
    case 'title14Earned':return [' TITLE EARNED!','--------------','',' '+n,'',' Gargoyle-Crusher',' of the Deep!',' [Tap] Continue'].join('\n')

    case 'vera5':        return [' VERA',' Dungeon Warrior','-----------','',' "Necro II at N.',' Revives to 8 HP',' this time. Twice',' as stubborn."',' [Tap] Next'].join('\n')
    case 'vera6':        return [' VERA',' Dungeon Warrior','-----------','',' "Kill it twice.',' Second kill is',' permanent. Then',' find Elder Moss."',' [Tap] Accept'].join('\n')
    case 'vera3Accepted':return [' QUEST 15','--------','', ' Defeat the',' Necromancer II N.',' Revives to 8 HP.',' Kill it twice!',' [Tap] Continue'].join('\n')
    case 'vera3Reward':  return [' VERA',' Dungeon Warrior','-----------','',' "Incredible! Find',' Elder Moss now.',' He knows about',' the Dragons."',' [Tap] Next'].join('\n')
    case 'title15Earned':return [' TITLE EARNED!','--------------','',' '+n,'',' Necro-Master',' of the Dungeon!',' [Tap] Continue'].join('\n')

    case 'moss1': {
      const sc: Record<number,string> = {0:'A Triangle.',1:'A Circle.',2:'A Square.',3:'A Star.',4:'A Diamond.',5:'A Cross.'}
      return [' ELDER MOSS',' Dungeon Elder','-----------','',' "'+n+'. '+(sc[shapeIndex]||'A hero.')+'"',' "Cursed Knight II',' at K. Hits harder.',' Steals more gold."',' [Tap] Next'].join('\n')
    }
    case 'moss2':        return [' ELDER MOSS',' Dungeon Elder','-----------','',' "Steel yourself.',' It will drain',' your treasury fast.',' Move quickly!"',' [Tap] Accept'].join('\n')
    case 'mossAccepted': return [' QUEST 16','--------','', ' Defeat the',' Knight II at K.',' Steals more gold.',' Move fast!',' [Tap] Continue'].join('\n')
    case 'mossReward':   return [' ELDER MOSS',' Dungeon Elder','-----------','',' "Well fought."',' "Now. The Dragons.',' A Young Dragon',' lurks at Q."',' [Tap] Next'].join('\n')
    case 'title16Earned':return [' TITLE EARNED!','--------------','',' '+n,'',' Knight-Master',' of the Dungeon!',' [Tap] Continue'].join('\n')

    case 'moss3':        return [' ELDER MOSS',' Dungeon Elder','-----------','',' "Young Dark Dragon',' at Q. Fire breath',' 3 damage, ignores',' your shield."',' [Tap] Next'].join('\n')
    case 'moss4':        return [' ELDER MOSS',' Dungeon Elder','-----------','',' "Always hits 2.',' Fire breath 30%',' chance. Do not',' let it breathe."',' [Tap] Accept'].join('\n')
    case 'moss2Accepted':return [' QUEST 17','--------','', ' Defeat the',' Young Dragon Q.',' 2 dmg always.',' Fire: 3 dmg ignores',' defend! [Tap]'].join('\n')
    case 'moss2Reward':  return [' ELDER MOSS',' Dungeon Elder','-----------','',' "Young blood spilt.',' But the true Dragon',' is deeper at Q."',' [Tap] Next'].join('\n')
    case 'title17Earned':return [' TITLE EARNED!','--------------','',' '+n,'',' Dragon-Tamer',' of the Dungeon!',' [Tap] Continue'].join('\n')

    case 'moss5':        return [' ELDER MOSS',' Dungeon Elder','-----------','',' "The Dark Dragon.',' Full grown. More',' HP. More fire.',' More fury."',' [Tap] Next'].join('\n')
    case 'moss6':        return [' ELDER MOSS',' Dungeon Elder','-----------','',' "Survive the fire.',' The Dragon at Q',' will fall. Then',' find Thane."',' [Tap] Accept'].join('\n')
    case 'moss3Accepted':return [' QUEST 18','--------','', ' Defeat the',' Dark Dragon Q.',' Full power now.',' Fire breath 3 dmg.',' [Tap] Continue'].join('\n')
    case 'moss3Reward':  return [' ELDER MOSS',' Dungeon Elder','-----------','',' "The Dragon falls!"',' "But its elders',' still live. Find',' Thane. He knows."',' [Tap] Next'].join('\n')
    case 'title18Earned':return [' TITLE EARNED!','--------------','',' '+n,'',' Dragon-Slayer',' of the Dungeon!',' [Tap] Continue'].join('\n')

    case 'thane1': {
      const sc: Record<number,string> = {0:'Triangle spirit.',1:'Circle strength.',2:'Square guard.',3:'Star power.',4:'Diamond luck.',5:'Cross faith.'}
      return [' THANE',' Dungeon Guardian','-----------','',' "'+n+'. '+(sc[shapeIndex]||'True hero.')+'"',' "Dragon Elder Q.',' Ancient and vast.',' More fire. More',' HP. More wrath."',' [Tap] Next'].join('\n')
    }
    case 'thane2':       return [' THANE',' Dungeon Guardian','-----------','',' "I have guarded',' this dungeon long.',' None have passed',' the Elder. Go."',' [Tap] Accept'].join('\n')
    case 'thaneAccepted':return [' QUEST 19','--------','', ' Defeat the',' Dragon Elder Q.',' 18 HP. More fire.',' More damage.',' [Tap] Continue'].join('\n')
    case 'thaneReward':  return [' THANE',' Dungeon Guardian','-----------','',' "The Elder falls!"',' "I am... amazed."',' "One remains.',' Dragon King Q."',' [Tap] Next'].join('\n')
    case 'title19Earned':return [' TITLE EARNED!','--------------','',' '+n,'',' Dragon-Elder',' of the Dungeon!',' [Tap] Continue'].join('\n')

    case 'thane3':       return [' THANE',' Dungeon Guardian','-----------','',' "Dragon King Q."',' "20 HP. The most',' powerful foe in',' the dungeon."',' [Tap] Next'].join('\n')
    case 'thane4':       return [' THANE',' Dungeon Guardian','-----------','',' "Defeat it and',' face the Shadow',' Lord. The true',' final battle."',' [Tap] Accept'].join('\n')
    case 'thane2Accepted':return [' QUEST 20','--------','', ' Defeat the',' Dragon King Q.',' 20 HP. Full power.',' Then face the Boss!',' [Tap] Continue'].join('\n')
    case 'thane2Reward': return [' THANE',' Dungeon Guardian','-----------','',' "DRAGON KING SLAIN!"',' "You are truly',' the greatest hero',' this dungeon has',' ever seen. GO!"',' [Tap] Next'].join('\n')
    case 'title20Earned':return [' TITLE EARNED!','--------------','',' '+n,'',' Dragon-King',' of the Dungeon!',' Boss awaits!',' [Tap] Continue'].join('\n')

    // ── BOSS ────────────────────────────
    case 'trollGreet': return [' THE TROLL','----------','',' "WHAT IS YOUR',' QUEST,',' little '+charShape+'?"','',' You ready your',' weapon. [Tap]'].join('\n')
    case 'bossGreet':  return [' THE SHADOW LORD','----------------','',' "So you have',' come, little',' '+charShape+'...',' Twenty quests,',' and still you',' dare? FIGHT!"',' [Tap] FIGHT!'].join('\n')
    case 'bossVictory':return [' INCREDIBLE!','------------','',' The Shadow Lord',' dissolves into',' darkness!','',' You are now',' [Tap] a LEGEND!'].join('\n')
    case 'bossReward': return [' LEGEND TITLE!','--------------','',' '+n,' Shadow-Slayer',' of the Realm','',' Your story is',' complete! [Tap]'].join('\n')

    // ── COMBAT ──────────────────────────
    case 'combat': return [
      ' ' + enemy.location,
      '-'.repeat(Math.min(enemy.location.length + 1, 16)),
      ' HP: ' + statusLine,
      ' ' + enemy.name + ': ' + enemyLine,
      '', ' [Tap] Attack', ' [Sw dn] Defend',
      ' [Dbl] Power' + (powerUsed ? '(used)' : '!'), ' [Sw up] Menu',
    ].join('\n')

    case 'combatMenu': return [
      ' COMBAT MENU','------------',
      ' POT:' + potionCount + '/' + getPotionMax() + '  HP:' + playerHP + '/' + maxPlayerHP,'',
      ' [Tap] Use Potion +2HP',
      ' [Sw up] Flee',
      ' [Sw dn] Back','',
      potionCount === 0 ? ' (no potions!)' : ' Ready to drink!',
    ].join('\n')

    case 'fleeConfirm': return [' FLEE?','------','',' The '+enemy.name,' watches you',' hesitate...','',' [Tap] Flee!',' [Sw dn] Stay!'].join('\n')

    case 'playerHit': return [' HIT!','-----',' '+lastPlayerAttack,'',' '+enemy.name+': '+(enemyCurrentHP>0?'█'.repeat(enemyCurrentHP):'dead!'),' HP: '+'♥'.repeat(playerHP),'',enemyCurrentHP>0?' It readies...':' Defeated!',' [Tap] Continue'].join('\n')
    case 'playerMiss': return [' MISS!','------',' '+lastPlayerAttack,'',' '+enemy.name+': '+'█'.repeat(enemyCurrentHP),' HP: '+'♥'.repeat(playerHP),'',' It grins...',' [Tap] Continue'].join('\n')
    case 'playerDefend': return [' BLOCKED!','---------',' '+lastPlayerAttack,'',' '+enemy.name+': '+'█'.repeat(enemyCurrentHP),' HP: '+'♥'.repeat(playerHP),'',' Damage blocked!',' [Tap] Continue'].join('\n')
    case 'playerDefendFail': return [' FAILED!','--------',' '+lastPlayerAttack,'',' '+enemy.name+': '+'█'.repeat(enemyCurrentHP),' HP: '+'♥'.repeat(playerHP),'',' Blow lands!',' [Tap] Continue'].join('\n')
    case 'playerPower': return [' POWER STRIKE!','--------------',' '+lastPlayerAttack,'',' '+enemy.name+': '+(enemyCurrentHP>0?'█'.repeat(enemyCurrentHP):'dead!'),' HP: '+'♥'.repeat(playerHP),'',enemyCurrentHP>0?' It staggers!':' Killing blow!',' [Tap] Continue'].join('\n')
    case 'playerPowerMiss': return [' WASTED!','--------',' '+lastPlayerAttack,'',' '+enemy.name+': '+'█'.repeat(enemyCurrentHP),' HP: '+'♥'.repeat(playerHP),'',' It mocks you!',' [Tap] Continue'].join('\n')
    case 'enemyAttack': return [' ENEMY STRIKES!','---------------',' '+lastEnemyAttack,'',' HP: '+(playerHP>0?'♥'.repeat(playerHP):'empty!'),' '+enemy.name+': '+'█'.repeat(enemyCurrentHP),'',playerHP>0?' Steel yourself.':' Fading...',' [Tap] Continue'].join('\n')
    case 'victory': return [' VICTORY!','---------','',' Well done, '+n+'!',' The '+enemy.name,' is defeated!','',' +'+enemy.gold+' gold!',' [Tap] Return'].join('\n')
    case 'dead': return [' DARKNESS...','------------','',' The '+enemy.name,' defeats you,',' '+n+'.','',  ' -2 Quests!',' [Tap] Rise again'].join('\n')
    default: return ''
  }
}

// ═══════════════════════════════════════
// CONTAINERS
// ═══════════════════════════════════════

function buildExploreContainer(): object {
  return { containerTotalNum: 3, textObject: [
    { containerName: 'capture', containerID: 1, xPosition: 0, yPosition: 0, width: 576, height: 288, content: ' ', isEventCapture: 1 },
    { containerName: 'map',     containerID: 2, xPosition: 0, yPosition: 0, width: 384, height: 288, content: renderMap() },
    { containerName: 'legend',  containerID: 3, xPosition: 384, yPosition: 0, width: 192, height: 288, content: renderLegend() },
  ]}
}
function buildForestContainer(): object {
  return { containerTotalNum: 3, textObject: [
    { containerName: 'capture', containerID: 1, xPosition: 0, yPosition: 0, width: 576, height: 288, content: ' ', isEventCapture: 1 },
    { containerName: 'map',     containerID: 2, xPosition: 0, yPosition: 0, width: 384, height: 288, content: renderForestMap() },
    { containerName: 'legend',  containerID: 3, xPosition: 384, yPosition: 0, width: 192, height: 288, content: renderForestLegend() },
  ]}
}
function buildSwampContainer(): object {
  return { containerTotalNum: 3, textObject: [
    { containerName: 'capture', containerID: 1, xPosition: 0, yPosition: 0, width: 576, height: 288, content: ' ', isEventCapture: 1 },
    { containerName: 'map',     containerID: 2, xPosition: 0, yPosition: 0, width: 384, height: 288, content: renderSwampMap() },
    { containerName: 'legend',  containerID: 3, xPosition: 384, yPosition: 0, width: 192, height: 288, content: renderSwampLegend() },
  ]}
}
function buildDungeonContainer(): object {
  return { containerTotalNum: 3, textObject: [
    { containerName: 'capture', containerID: 1, xPosition: 0, yPosition: 0, width: 576, height: 288, content: ' ', isEventCapture: 1 },
    { containerName: 'map',     containerID: 2, xPosition: 0, yPosition: 0, width: 384, height: 288, content: renderDungeonMap() },
    { containerName: 'legend',  containerID: 3, xPosition: 384, yPosition: 0, width: 192, height: 288, content: renderDungeonLegend() },
  ]}
}
function buildStandardContainer(name: Screen): object {
  return { containerTotalNum: 3, textObject: [
    { containerName: 'capture', containerID: 1, xPosition: 0, yPosition: 0, width: 576, height: 288, content: ' ', isEventCapture: 1 },
    { containerName: 'content', containerID: 2, xPosition: 0, yPosition: 0, width: 288, height: 288, content: getScreenText(name) },
    { containerName: 'anim',    containerID: 3, xPosition: 288, yPosition: 0, width: 288, height: 288, content: getAnimation(name) },
  ]}
}

// ═══════════════════════════════════════
// ANIMATION TIMER
// ═══════════════════════════════════════

function startAnimation() {
  stopAnimation(); animFrame = 0
  animationTimer = setInterval(async () => {
    if (!bridge) return; animFrame++
    try { await bridge.textContainerUpgrade({ containerID: 3, containerName: 'anim', content: getAnimation(currentScreen) }) } catch (e) {}
  }, 150)
}
function stopAnimation() { if (animationTimer) { clearInterval(animationTimer); animationTimer = null } }

// ═══════════════════════════════════════
// SHOW SCREEN
// ═══════════════════════════════════════

async function showScreen(name: Screen) {
  const isExplore  = name === 'explore'
  const isForest   = name === 'forestExplore'
  const isSwamp    = name === 'swampExplore'
  const isDungeon  = name === 'dungeonExplore'
  const wasExplore = currentScreen === 'explore'
  const wasForest  = currentScreen === 'forestExplore'
  const wasSwamp   = currentScreen === 'swampExplore'
  const wasDungeon = currentScreen === 'dungeonExplore'
  currentScreen = name
  setStatus('Showing: ' + name)
  if (name === 'charSelect') showNameForm(); else hideNameForm()
  updatePhoneStats()

  if (isExplore && wasExplore && lastBuiltIsExplore && pageCreated) {
    try { await bridge.textContainerUpgrade({ containerID: 2, containerName: 'map', content: renderMap() }); return } catch (e) {}
  }
  if (isForest && wasForest && lastBuiltIsExplore && pageCreated) {
    try { await bridge.textContainerUpgrade({ containerID: 2, containerName: 'map', content: renderForestMap() }); return } catch (e) {}
  }
  if (isSwamp && wasSwamp && lastBuiltIsExplore && pageCreated) {
    try { await bridge.textContainerUpgrade({ containerID: 2, containerName: 'map', content: renderSwampMap() }); return } catch (e) {}
  }
  if (isDungeon && wasDungeon && lastBuiltIsExplore && pageCreated) {
    try { await bridge.textContainerUpgrade({ containerID: 2, containerName: 'map', content: renderDungeonMap() }); return } catch (e) {}
  }

  stopAnimation()
  let container: object
  if (isExplore)      container = buildExploreContainer()
  else if (isForest)  container = buildForestContainer()
  else if (isSwamp)   container = buildSwampContainer()
  else if (isDungeon) container = buildDungeonContainer()
  else                container = buildStandardContainer(name)

  if (!pageCreated) { await bridge.createStartUpPageContainer(container); pageCreated = true }
  else              { await bridge.rebuildPageContainer(container) }

  lastBuiltIsExplore = isExplore || isForest || isSwamp || isDungeon
  if (!isExplore && !isForest && !isSwamp && !isDungeon) startAnimation()
}

// ═══════════════════════════════════════
// COMBAT HELPERS
// ═══════════════════════════════════════

function chance(p: number): boolean { return Math.random() * 100 < p }

function enterCombat(boss = false) {
  const enemy = getCurrentEnemy()
  enemyCurrentHP = enemy.hp
  isDefending = false; defendSucceeded = false
  poisoned = false; trollCharging = false
  bansheeStunned = false; hydraRegrown = false
  necroRevived = false; gargoyleStoned = false
  isBossFight = boss; bossShielded = false
  tempAtkBonus = 0; tempLucky = false
  // Cursed Blade: lose 1 HP at start of combat (min 1)
  if (hasCursedBlade && playerHP > 1) { playerHP -= 1 }
  // First strike
  if ((hasBow || hasEnchantedBow) && enemyCurrentHP > 0) {
    enemyCurrentHP -= hasEnchantedBow ? 2 : 1
    if (enemyCurrentHP < 0) enemyCurrentHP = 0
  }
}

function getReturnScreen(): Screen {
  if (questPhase >= 30 && questPhase <= 59) return 'dungeonExplore'
  if (questPhase >= 21 && questPhase <= 29) return 'swampExplore'
  if (questPhase >= 6) return 'forestExplore'
  return 'explore'
}

function applyDeathPenalty() {
  const currentQuest = Math.floor(questPhase / 3) + 1
  const targetQuest  = Math.max(1, currentQuest - 2)
  questPhase = (targetQuest - 1) * 3
  playerHP = maxPlayerHP; powerUsed = false
  poisoned = false; trollCharging = false; bansheeStunned = false
  hydraRegrown = false; necroRevived = false; gargoyleStoned = false
  isBossFight = false; bossShielded = false
  tempAtkBonus = 0; tempLucky = false
  playerX = 3; playerY = 5
  forestPlayerX = 3; forestPlayerY = 9
  swampPlayerX = 3; swampPlayerY = 9
  dungeonPlayerX = 3; dungeonPlayerY = 9
  saveProgress()
}

function handleVictoryProgression(): Screen {
  fightsWon++
  if (hasSoulStone) powerUsed = false
  if (isBossFight) {
    questPhase = 61; playerGold += ENEMIES[6].gold
    if (hasHealingRing) playerHP = Math.min(playerHP + 3, maxPlayerHP)
    isBossFight = false; saveProgress(); return 'bossVictory'
  }
  const progressMap: Record<number, number> = {
    1:2, 4:5, 7:8, 10:11, 13:14,
    16:17, 19:20, 22:23, 25:26, 28:29,
    31:32, 34:35, 37:38, 40:41, 43:44,
    46:47, 49:50, 52:53, 55:56, 58:59,
  }
  if (progressMap[questPhase] !== undefined) questPhase = progressMap[questPhase]
  playerGold += getCurrentEnemy().gold
  if (hasHealingRing) playerHP = Math.min(playerHP + 3, maxPlayerHP)
  saveProgress(); return 'victory'
}

async function handleEnemyTurn() {
  const eid = getActiveEnemyId()

  if (enemyCurrentHP <= 0) {
    // Hydra regrow
    if (!isBossFight && eid === 10 && !hydraRegrown) {
      hydraRegrown = true; enemyCurrentHP = 2
      lastEnemyAttack = 'A HEAD REGROWS! +2HP!'; await showScreen('enemyAttack'); return
    }
    // Necromancer revive (Q12 and Q15)
    if (!isBossFight && (eid === 13 || eid === 16) && !necroRevived) {
      necroRevived = true
      enemyCurrentHP = eid === 16 ? 8 : 6
      lastEnemyAttack = randomFrom(necroRevives); await showScreen('enemyAttack'); return
    }
    const next = handleVictoryProgression()
    await showScreen(next); return
  }

  if (isBossFight) {
    const dodge = getDodgeChance()
    if (dodge > 0 && Math.random() < dodge) {
      lastEnemyAttack = 'Your shield deflects it!'
      isDefending = false; defendSucceeded = false; await showScreen('enemyAttack'); return
    }
    const phase = getBossPhase()
    if (phase === 1) {
      lastEnemyAttack = randomFrom(bossAttacks1)
      if (!defendSucceeded) playerHP -= 1
      if (Math.random() < 0.2) { bossShielded = true; lastEnemyAttack += ' ' + randomFrom(bossShieldRaise) }
    } else if (phase === 2) {
      lastEnemyAttack = randomFrom(bossAttacks2)
      if (!defendSucceeded) playerHP -= Math.random() < 0.5 ? 2 : 1; else playerHP -= 1
      if (Math.random() < 0.3) { bossShielded = true; lastEnemyAttack += ' SHIELD!' }
    } else {
      lastEnemyAttack = randomFrom(bossAttacks3)
      if (!defendSucceeded) playerHP -= Math.random() < 0.5 ? 2 : 1; else playerHP -= 1
    }
    defendSucceeded = false
    if (playerHP < 0) playerHP = 0
    if (shapeIndex === 5 && playerHP > 0 && playerHP < Math.floor(maxPlayerHP / 2)) playerHP = Math.min(playerHP + 1, maxPlayerHP)
    await showScreen('enemyAttack'); return
  }

  // Dodge check for regular enemies
  const dodge = getDodgeChance()
  if (dodge > 0 && Math.random() < dodge) {
    lastEnemyAttack = 'Your shield deflects it!'
    isDefending = false; defendSucceeded = false; await showScreen('enemyAttack'); return
  }

  if (poisoned) { playerHP -= 1; poisoned = false }

  if (eid === 1) {
    lastEnemyAttack = randomFrom(defendSucceeded ? slimeRetaliates : slimeAttacks)
    playerHP -= 1; defendSucceeded = false
  } else if (eid === 2) {
    const enraged = enemyCurrentHP <= 1
    if (enraged) {
      lastEnemyAttack = randomFrom(skelRageAttacks)
      if (!defendSucceeded) playerHP -= 1
      if (playerHP > 0 && Math.random() < 0.5) playerHP -= 1
    } else {
      lastEnemyAttack = randomFrom(skelAttacks)
      if (!defendSucceeded) playerHP -= 1
    }
    defendSucceeded = false
  } else if (eid === 3) {
    lastEnemyAttack = randomFrom(spiderAttacks)
    if (!defendSucceeded) {
      playerHP -= 1
      if (Math.random() < 0.3) { poisoned = true; lastEnemyAttack = randomFrom(spiderPoisons) }
    }
    defendSucceeded = false
  } else if (eid === 4) {
    const playerJustMissed = currentScreen === 'playerMiss' || currentScreen === 'playerPowerMiss'
    lastEnemyAttack = randomFrom(wolfAttacks)
    if (!defendSucceeded) {
      playerHP -= 1
      if (playerJustMissed && playerHP > 0) { playerHP -= 1; lastEnemyAttack = randomFrom(wolfDoubleAttacks) }
    }
    defendSucceeded = false
  } else if (eid === 5) {
    if (!trollCharging) {
      trollCharging = true; lastEnemyAttack = randomFrom(trollChargeTurns)
    } else {
      trollCharging = false; lastEnemyAttack = randomFrom(trollSlam)
      if (!defendSucceeded) playerHP -= 2; else playerHP -= 1
    }
    defendSucceeded = false
  } else if (eid === 7) {
    if (Math.random() < 0.3) { bansheeStunned = true; lastEnemyAttack = randomFrom(bansheeStuns) }
    else { lastEnemyAttack = randomFrom(bansheeAttacks) }
    if (!defendSucceeded) playerHP -= 1; defendSucceeded = false
  } else if (eid === 8) {
    lastEnemyAttack = randomFrom(vampireAttacks)
    if (!defendSucceeded) {
      playerHP -= 1
      enemyCurrentHP = Math.min(enemyCurrentHP + 1, ENEMIES[8].hp)
      lastEnemyAttack += ' (heals 1!)'
    }
    defendSucceeded = false
  } else if (eid === 9) {
    lastEnemyAttack = randomFrom(wraithAttacks)
    if (!defendSucceeded) {
      playerHP -= 1
      if (Math.random() < 0.2) { poisoned = true; lastEnemyAttack = randomFrom(wraithPoisons) }
    }
    defendSucceeded = false
  } else if (eid === 10) {
    lastEnemyAttack = randomFrom(hydraAttacks)
    if (!defendSucceeded) playerHP -= 1; defendSucceeded = false
  } else if (eid === 11) {
    lastEnemyAttack = randomFrom(knightAttacks)
    if (!defendSucceeded) playerHP -= 2; else playerHP -= 1; defendSucceeded = false
  } else if (eid === 12 || eid === 15) {
    // Gargoyle: 50% chance turn to stone - skip attack, player attacks miss next turn
    if (Math.random() < 0.5) {
      gargoyleStoned = true
      lastEnemyAttack = randomFrom(gargoyleTurns)
      // no damage this turn
    } else {
      gargoyleStoned = false
      lastEnemyAttack = randomFrom(gargoyleAttacks)
      if (!defendSucceeded) playerHP -= 1
    }
    defendSucceeded = false
  } else if (eid === 13 || eid === 16) {
    lastEnemyAttack = randomFrom(necroAttacks)
    if (!defendSucceeded) playerHP -= 1; defendSucceeded = false
  } else if (eid === 14 || eid === 17) {
    // Cursed Knight: steals gold on hit
    lastEnemyAttack = randomFrom(cursedKnightAtks)
    if (!defendSucceeded) {
      if (playerGold > 0) {
        const stolen = Math.min(playerGold, Math.floor(Math.random() * 6) + 5)
        playerGold -= stolen
        lastEnemyAttack = stolen + 'g stolen!'
      } else {
        playerHP -= 1
        lastEnemyAttack = 'No gold! Takes HP!'
      }
    }
    defendSucceeded = false
  } else {
    // Dragon (eid 18-21): always 2 damage, 30% fire breath = 3 and ignores defend
    const fireBroken = Math.random() < 0.3
    if (fireBroken) {
      lastEnemyAttack = randomFrom(dragonFire)
      playerHP -= 3  // fire ignores defend
    } else {
      lastEnemyAttack = randomFrom(dragonAttacks)
      if (!defendSucceeded) playerHP -= 2; else playerHP -= 1
    }
    defendSucceeded = false
  }

  isDefending = false
  if (playerHP < 0) playerHP = 0
  if (shapeIndex === 5 && playerHP > 0 && playerHP < Math.floor(maxPlayerHP / 2)) playerHP = Math.min(playerHP + 1, maxPlayerHP)
  await showScreen('enemyAttack')
}

async function handleCombatContinue() {
  if (playerHP <= 0) { playerHP = maxPlayerHP; await showScreen('dead'); return }
  const eid = getActiveEnemyId()
  if (enemyCurrentHP <= 0) {
    if (!isBossFight && eid === 10 && !hydraRegrown) {
      hydraRegrown = true; enemyCurrentHP = 2
      lastEnemyAttack = 'A HEAD REGROWS! +2HP!'; await showScreen('enemyAttack'); return
    }
    if (!isBossFight && (eid === 13 || eid === 16) && !necroRevived) {
      necroRevived = true
      enemyCurrentHP = eid === 16 ? 8 : 6
      lastEnemyAttack = randomFrom(necroRevives); await showScreen('enemyAttack'); return
    }
    const next = handleVictoryProgression()
    await showScreen(next); return
  }
  await showScreen('combat')
}

// ═══════════════════════════════════════
// INPUT
// ═══════════════════════════════════════

let lastInputTime = 0
const INPUT_COOLDOWN = 800, EXPLORE_COOLDOWN = 80

function getEventType(event: any): number | null {
  return event?.textEvent?.eventType ?? event?.listEvent?.eventType ?? event?.sysEvent?.eventType ?? null
}

async function handleInput(event: any) {
  const now = Date.now()
  const isMap = ['explore','forestExplore','swampExplore','dungeonExplore'].includes(currentScreen)
  if (now - lastInputTime < (isMap ? EXPLORE_COOLDOWN : INPUT_COOLDOWN)) return
  const resolvedType = getEventType(event) ?? 0
  if (!validInputs[currentScreen].includes(resolvedType)) return
  lastInputTime = now

  const isTap       = resolvedType === 0
  const isSwipeUp   = resolvedType === 1
  const isSwipeDown = resolvedType === 2
  const isDoubleTap = resolvedType === 3

  // ── TITLE ───────────────────────────
  if (currentScreen === 'title') {
    if (isTap) { clearProgress(); playerHP = maxPlayerHP; shapeIndex = 0; await showScreen('charSelect') }
    else if (isSwipeUp && hasSave()) {
      loadProgress(); playerHP = maxPlayerHP
      playerX = 3; playerY = 5; forestPlayerX = 3; forestPlayerY = 9
      swampPlayerX = 3; swampPlayerY = 9; dungeonPlayerX = 3; dungeonPlayerY = 9
      lastBuiltIsExplore = false
      if (questPhase >= 30) await showScreen('dungeonExplore')
      else if (questPhase >= 21) await showScreen('swampExplore')
      else if (questPhase >= 6) await showScreen('forestExplore')
      else await showScreen('explore')
    }
    else if (isDoubleTap) { await showScreen('help') }

  } else if (currentScreen === 'help') { await showScreen('title') }

  // ── CHAR SELECT ─────────────────────
  else if (currentScreen === 'charSelect') {
    if (isSwipeUp)        { shapeIndex = (shapeIndex + 1) % SHAPES.length; await showScreen('charSelect') }
    else if (isSwipeDown) { shapeIndex = (shapeIndex - 1 + SHAPES.length) % SHAPES.length; await showScreen('charSelect') }
    else if (isTap)       { await showScreen('charSelect') }

  } else if (currentScreen === 'upgrade') {
    if (isTap)          { attackBonus++; saveProgress(); await showScreen(getReturnScreen()) }
    else if (isSwipeUp) { maxPlayerHP++; playerHP = maxPlayerHP; saveProgress(); await showScreen(getReturnScreen()) }

  } else if (currentScreen === 'secretUpgrade') {
    secretFound = true
    if (isTap)          { attackBonus++; saveProgress(); await showScreen('explore') }
    else if (isSwipeUp) { maxPlayerHP++; playerHP = maxPlayerHP; saveProgress(); await showScreen('explore') }

  // ── MERCHANT ────────────────────────
  } else if (currentScreen === 'merchant') {
    if (isDoubleTap) { merchantMessage = ''; lastBuiltIsExplore = false; await showScreen('explore') }
    else if (isSwipeUp)   { merchantItemIndex = (merchantItemIndex - 1 + SHOP_ITEMS.length) % SHOP_ITEMS.length; await showScreen('merchant') }
    else if (isSwipeDown) { merchantItemIndex = (merchantItemIndex + 1) % SHOP_ITEMS.length; await showScreen('merchant') }
    else if (isTap) {
      const item = SHOP_ITEMS[merchantItemIndex]
      const isPotion = item.key === 'potion'
      if (isPotion) {
        if (potionCount >= getPotionMax()) { merchantMessage = 'Potions full!'; await showScreen('merchantMsg') }
        else if (playerGold < item.price)  { merchantMessage = 'Need 15g!';    await showScreen('merchantMsg') }
        else { playerGold -= item.price; potionCount++; saveProgress(); await showScreen('merchant') }
      } else {
        const owned = getItemOwned(item.key)
        if (owned)                        { merchantMessage = 'Already owned!';  await showScreen('merchantMsg') }
        else if (inventoryCount() >= 5)   { merchantMessage = 'Bag full! (5/5)'; await showScreen('merchantMsg') }
        else if (playerGold < item.price) { merchantMessage = 'Need ' + item.price + 'g!'; await showScreen('merchantMsg') }
        else {
          playerGold -= item.price
          if (item.key === 'sword')   { hasSword = true; attackBonus++ }
          if (item.key === 'shield')  { hasShield = true }
          if (item.key === 'bow')     { hasBow = true }
          if (item.key === 'pouch')   { hasPouch = true; maxPlayerHP += 2; playerHP += 2 }
          if (item.key === 'mstaff')  { hasMagicStaff = true; attackBonus += 2 }
          if (item.key === 'dshield') { hasDragonShield = true }
          if (item.key === 'ebow')    { hasEnchantedBow = true }
          if (item.key === 'hring')   { hasHealingRing = true }
          saveProgress(); await showScreen('merchant')
        }
      }
    }
  } else if (currentScreen === 'merchantMsg') { await showScreen('merchant') }

  // ── SWAMP SHOP ──────────────────────
  else if (currentScreen === 'swampShop') {
    if (isSwipeUp) { lastBuiltIsExplore = false; await showScreen('swampExplore') }
    else if (isTap) {
      if (hasSoulStone)         { swampShopMessage = 'Already owned!'; await showScreen('swampShopMsg') }
      else if (inventoryCount() >= 5) { swampShopMessage = 'Bag full!';       await showScreen('swampShopMsg') }
      else if (playerGold < 80) { swampShopMessage = 'Need 80g!';       await showScreen('swampShopMsg') }
      else { playerGold -= 80; hasSoulStone = true; saveProgress(); await showScreen('swampShop') }
    }
  } else if (currentScreen === 'swampShopMsg') { await showScreen('swampShop') }

  // ── DUNGEON SHOP ────────────────────
  else if (currentScreen === 'dungeonShop') {
    if (isSwipeUp) { lastBuiltIsExplore = false; await showScreen('dungeonExplore') }
    else if (isTap) {
      if (hasCursedBlade)       { dungeonShopMessage = 'Already owned!'; await showScreen('dungeonShopMsg') }
      else if (inventoryCount() >= 5) { dungeonShopMessage = 'Bag full!';       await showScreen('dungeonShopMsg') }
      else if (playerGold < 90) { dungeonShopMessage = 'Need 90g!';       await showScreen('dungeonShopMsg') }
      else {
        playerGold -= 90; hasCursedBlade = true; attackBonus += 3
        saveProgress(); await showScreen('dungeonShop')
      }
    }
  } else if (currentScreen === 'dungeonShopMsg') { await showScreen('dungeonShop') }

  // ── FOUND ITEM ──────────────────────
  else if (currentScreen === 'foundItem') { lastBuiltIsExplore = false; await showScreen(returnScreenAfterFind) }

  // ── MAPS ────────────────────────────
  else if (currentScreen === 'explore') {
    dotCollectedThisMove = false
    let special: Screen | null = null
    if (isTap)            special = movePlayerWithTileCheck(1,  0, 5)
    else if (isDoubleTap) special = movePlayerWithTileCheck(-1, 0, 5)
    else if (isSwipeUp)   special = movePlayerWithTileCheck(0, -1, 1)
    else if (isSwipeDown) special = movePlayerWithTileCheck(0,  1, 1)
    if (special) {
      if (special === 'combat')        { enterCombat(false); lastBuiltIsExplore = false }
      if (special === 'forestExplore') { forestPlayerX = 3; forestPlayerY = 9; lastBuiltIsExplore = false }
      if (special === 'merchant')      { merchantMessage = ''; merchantItemIndex = 0; lastBuiltIsExplore = false }
      if (special === 'secretUpgrade') { lastBuiltIsExplore = false }
      if (special === 'foundItem')     { lastBuiltIsExplore = false }
      await showScreen(special); return
    }
    if (dotCollectedThisMove) lastBuiltIsExplore = false
    await showScreen('explore')

  } else if (currentScreen === 'forestExplore') {
    dotCollectedThisMove = false
    let special: Screen | null = null
    if (isTap)            special = moveForestPlayerWithTileCheck(1,  0, 5)
    else if (isDoubleTap) special = moveForestPlayerWithTileCheck(-1, 0, 5)
    else if (isSwipeUp)   special = moveForestPlayerWithTileCheck(0, -1, 1)
    else if (isSwipeDown) special = moveForestPlayerWithTileCheck(0,  1, 1)
    if (special) {
      if (special === 'combat')      { enterCombat(false); lastBuiltIsExplore = false }
      if (special === 'bossGreet')   { lastBuiltIsExplore = false }
      if (special === 'swampExplore'){ swampPlayerX = 3; swampPlayerY = 9; lastBuiltIsExplore = false }
      if (special === 'explore')     { playerX = MFOREST_X; playerY = MFOREST_Y - 1; lastBuiltIsExplore = false }
      if (special === 'foundItem')   { lastBuiltIsExplore = false }
      await showScreen(special); return
    }
    if (dotCollectedThisMove) lastBuiltIsExplore = false
    await showScreen('forestExplore')

  } else if (currentScreen === 'swampExplore') {
    dotCollectedThisMove = false
    let special: Screen | null = null
    if (isTap)            special = moveSwampPlayerWithTileCheck(1,  0, 5)
    else if (isDoubleTap) special = moveSwampPlayerWithTileCheck(-1, 0, 5)
    else if (isSwipeUp)   special = moveSwampPlayerWithTileCheck(0, -1, 1)
    else if (isSwipeDown) special = moveSwampPlayerWithTileCheck(0,  1, 1)
    if (special) {
      if (special === 'combat')        { enterCombat(false); lastBuiltIsExplore = false }
      if (special === 'forestExplore') { forestPlayerX = FOREST_PORTAL_X - 1; forestPlayerY = FOREST_PORTAL_Y; lastBuiltIsExplore = false }
      if (special === 'dungeonExplore'){ dungeonPlayerX = 3; dungeonPlayerY = 9; lastBuiltIsExplore = false }
      if (special === 'swampShop')     { swampShopMessage = ''; lastBuiltIsExplore = false }
      if (special === 'foundItem')     { lastBuiltIsExplore = false }
      await showScreen(special); return
    }
    if (dotCollectedThisMove) lastBuiltIsExplore = false
    await showScreen('swampExplore')

  } else if (currentScreen === 'dungeonExplore') {
    dotCollectedThisMove = false
    let special: Screen | null = null
    if (isTap)            special = moveDungeonPlayerWithTileCheck(1,  0, 5)
    else if (isDoubleTap) special = moveDungeonPlayerWithTileCheck(-1, 0, 5)
    else if (isSwipeUp)   special = moveDungeonPlayerWithTileCheck(0, -1, 1)
    else if (isSwipeDown) special = moveDungeonPlayerWithTileCheck(0,  1, 1)
    if (special) {
      if (special === 'combat')      { enterCombat(false); lastBuiltIsExplore = false }
      if (special === 'swampExplore'){ swampPlayerX = SWAMP_DUNGEON_X - 1; swampPlayerY = SWAMP_DUNGEON_Y; lastBuiltIsExplore = false }
      if (special === 'dungeonShop') { dungeonShopMessage = ''; lastBuiltIsExplore = false }
      if (special === 'foundItem')   { lastBuiltIsExplore = false }
      await showScreen(special); return
    }
    if (dotCollectedThisMove) lastBuiltIsExplore = false
    await showScreen('dungeonExplore')

  // ── NPC DIALOGUE CHAINS ─────────────
  } else if (currentScreen === 'bram1')           { await showScreen('bram2') }
  else if (currentScreen === 'bram2')             { questPhase = 1;  saveProgress(); await showScreen('bramAccepted') }
  else if (currentScreen === 'bramAccepted')      { await showScreen('explore') }
  else if (currentScreen === 'bramReward')        { questPhase = 3;  saveProgress(); await showScreen('title1Earned') }
  else if (currentScreen === 'title1Earned')      { lastBuiltIsExplore = false; await showScreen('upgrade') }

  else if (currentScreen === 'greta1')            { await showScreen('greta2') }
  else if (currentScreen === 'greta2')            { questPhase = 4;  saveProgress(); await showScreen('gretaAccepted') }
  else if (currentScreen === 'gretaAccepted')     { await showScreen('explore') }
  else if (currentScreen === 'gretaReward')       { questPhase = 6;  saveProgress(); await showScreen('title2Earned') }
  else if (currentScreen === 'title2Earned')      { lastBuiltIsExplore = false; await showScreen('upgrade') }

  else if (currentScreen === 'aria1')             { await showScreen('aria2') }
  else if (currentScreen === 'aria2')             { questPhase = 7;  saveProgress(); await showScreen('ariaAccepted') }
  else if (currentScreen === 'ariaAccepted')      { await showScreen('forestExplore') }
  else if (currentScreen === 'ariaReward')        { questPhase = 9;  saveProgress(); await showScreen('title3Earned') }
  else if (currentScreen === 'title3Earned')      { lastBuiltIsExplore = false; await showScreen('upgrade') }

  else if (currentScreen === 'gareth1')           { await showScreen('gareth2') }
  else if (currentScreen === 'gareth2')           { questPhase = 10; saveProgress(); await showScreen('garethAccepted') }
  else if (currentScreen === 'garethAccepted')    { await showScreen('forestExplore') }
  else if (currentScreen === 'garethReward')      { questPhase = 12; saveProgress(); await showScreen('title4Earned') }
  else if (currentScreen === 'title4Earned')      { lastBuiltIsExplore = false; await showScreen('upgrade') }

  else if (currentScreen === 'thorin1')           { await showScreen('thorin2') }
  else if (currentScreen === 'thorin2')           { questPhase = 13; saveProgress(); await showScreen('thorinAccepted') }
  else if (currentScreen === 'thorinAccepted')    { await showScreen('forestExplore') }
  else if (currentScreen === 'thorinReward')      { questPhase = 15; saveProgress(); await showScreen('title5Earned') }
  else if (currentScreen === 'title5Earned')      { lastBuiltIsExplore = false; await showScreen('upgrade') }

  else if (currentScreen === 'lyra1')             { await showScreen('lyra2') }
  else if (currentScreen === 'lyra2')             { questPhase = 16; saveProgress(); await showScreen('lyraAccepted') }
  else if (currentScreen === 'lyraAccepted')      { await showScreen('forestExplore') }
  else if (currentScreen === 'lyraReward')        { questPhase = 18; saveProgress(); await showScreen('title6Earned') }
  else if (currentScreen === 'title6Earned')      { lastBuiltIsExplore = false; await showScreen('upgrade') }

  else if (currentScreen === 'dorin1')            { await showScreen('dorin2') }
  else if (currentScreen === 'dorin2')            { questPhase = 19; saveProgress(); await showScreen('dorinAccepted') }
  else if (currentScreen === 'dorinAccepted')     { await showScreen('forestExplore') }
  else if (currentScreen === 'dorinReward')       { questPhase = 21; saveProgress(); await showScreen('title7Earned') }
  else if (currentScreen === 'title7Earned')      { lastBuiltIsExplore = false; await showScreen('upgrade') }

  else if (currentScreen === 'mira1')             { await showScreen('mira2') }
  else if (currentScreen === 'mira2')             { questPhase = 22; saveProgress(); await showScreen('miraAccepted') }
  else if (currentScreen === 'miraAccepted')      { await showScreen('swampExplore') }
  else if (currentScreen === 'miraReward')        { questPhase = 24; saveProgress(); await showScreen('title8Earned') }
  else if (currentScreen === 'title8Earned')      { lastBuiltIsExplore = false; await showScreen('upgrade') }

  else if (currentScreen === 'mira3')             { await showScreen('mira4') }
  else if (currentScreen === 'mira4')             { questPhase = 25; saveProgress(); await showScreen('mira2Accepted') }
  else if (currentScreen === 'mira2Accepted')     { await showScreen('swampExplore') }
  else if (currentScreen === 'mira2Reward')       { questPhase = 27; saveProgress(); await showScreen('title9Earned') }
  else if (currentScreen === 'title9Earned')      { lastBuiltIsExplore = false; await showScreen('upgrade') }

  else if (currentScreen === 'zane1')             { await showScreen('zane2') }
  else if (currentScreen === 'zane2')             { questPhase = 28; saveProgress(); await showScreen('zaneAccepted') }
  else if (currentScreen === 'zaneAccepted')      { await showScreen('swampExplore') }
  else if (currentScreen === 'zaneReward')        { questPhase = 30; saveProgress(); await showScreen('title10Earned') }
  else if (currentScreen === 'title10Earned')     { lastBuiltIsExplore = false; await showScreen('upgrade') }

  else if (currentScreen === 'rook1')             { await showScreen('rook2') }
  else if (currentScreen === 'rook2')             { questPhase = 31; saveProgress(); await showScreen('rookAccepted') }
  else if (currentScreen === 'rookAccepted')      { await showScreen('dungeonExplore') }
  else if (currentScreen === 'rookReward')        { questPhase = 33; saveProgress(); await showScreen('title11Earned') }
  else if (currentScreen === 'title11Earned')     { lastBuiltIsExplore = false; await showScreen('upgrade') }

  else if (currentScreen === 'rook3')             { await showScreen('rook4') }
  else if (currentScreen === 'rook4')             { questPhase = 34; saveProgress(); await showScreen('rook2Accepted') }
  else if (currentScreen === 'rook2Accepted')     { await showScreen('dungeonExplore') }
  else if (currentScreen === 'rook2Reward')       { questPhase = 36; saveProgress(); await showScreen('title12Earned') }
  else if (currentScreen === 'title12Earned')     { lastBuiltIsExplore = false; await showScreen('upgrade') }

  else if (currentScreen === 'vera1')             { await showScreen('vera2') }
  else if (currentScreen === 'vera2')             { questPhase = 37; saveProgress(); await showScreen('veraAccepted') }
  else if (currentScreen === 'veraAccepted')      { await showScreen('dungeonExplore') }
  else if (currentScreen === 'veraReward')        { questPhase = 39; saveProgress(); await showScreen('title13Earned') }
  else if (currentScreen === 'title13Earned')     { lastBuiltIsExplore = false; await showScreen('upgrade') }

  else if (currentScreen === 'vera3')             { await showScreen('vera4') }
  else if (currentScreen === 'vera4')             { questPhase = 40; saveProgress(); await showScreen('vera2Accepted') }
  else if (currentScreen === 'vera2Accepted')     { await showScreen('dungeonExplore') }
  else if (currentScreen === 'vera2Reward')       { questPhase = 42; saveProgress(); await showScreen('title14Earned') }
  else if (currentScreen === 'title14Earned')     { lastBuiltIsExplore = false; await showScreen('upgrade') }

  else if (currentScreen === 'vera5')             { await showScreen('vera6') }
  else if (currentScreen === 'vera6')             { questPhase = 43; saveProgress(); await showScreen('vera3Accepted') }
  else if (currentScreen === 'vera3Accepted')     { await showScreen('dungeonExplore') }
  else if (currentScreen === 'vera3Reward')       { questPhase = 45; saveProgress(); await showScreen('title15Earned') }
  else if (currentScreen === 'title15Earned')     { lastBuiltIsExplore = false; await showScreen('upgrade') }

  else if (currentScreen === 'moss1')             { await showScreen('moss2') }
  else if (currentScreen === 'moss2')             { questPhase = 46; saveProgress(); await showScreen('mossAccepted') }
  else if (currentScreen === 'mossAccepted')      { await showScreen('dungeonExplore') }
  else if (currentScreen === 'mossReward')        { questPhase = 48; saveProgress(); await showScreen('title16Earned') }
  else if (currentScreen === 'title16Earned')     { lastBuiltIsExplore = false; await showScreen('upgrade') }

  else if (currentScreen === 'moss3')             { await showScreen('moss4') }
  else if (currentScreen === 'moss4')             { questPhase = 49; saveProgress(); await showScreen('moss2Accepted') }
  else if (currentScreen === 'moss2Accepted')     { await showScreen('dungeonExplore') }
  else if (currentScreen === 'moss2Reward')       { questPhase = 51; saveProgress(); await showScreen('title17Earned') }
  else if (currentScreen === 'title17Earned')     { lastBuiltIsExplore = false; await showScreen('upgrade') }

  else if (currentScreen === 'moss5')             { await showScreen('moss6') }
  else if (currentScreen === 'moss6')             { questPhase = 52; saveProgress(); await showScreen('moss3Accepted') }
  else if (currentScreen === 'moss3Accepted')     { await showScreen('dungeonExplore') }
  else if (currentScreen === 'moss3Reward')       { questPhase = 54; saveProgress(); await showScreen('title18Earned') }
  else if (currentScreen === 'title18Earned')     { lastBuiltIsExplore = false; await showScreen('upgrade') }

  else if (currentScreen === 'thane1')            { await showScreen('thane2') }
  else if (currentScreen === 'thane2')            { questPhase = 55; saveProgress(); await showScreen('thaneAccepted') }
  else if (currentScreen === 'thaneAccepted')     { await showScreen('dungeonExplore') }
  else if (currentScreen === 'thaneReward')       { questPhase = 57; saveProgress(); await showScreen('title19Earned') }
  else if (currentScreen === 'title19Earned')     { lastBuiltIsExplore = false; await showScreen('upgrade') }

  else if (currentScreen === 'thane3')            { await showScreen('thane4') }
  else if (currentScreen === 'thane4')            { questPhase = 58; saveProgress(); await showScreen('thane2Accepted') }
  else if (currentScreen === 'thane2Accepted')    { await showScreen('dungeonExplore') }
  else if (currentScreen === 'thane2Reward')      { questPhase = 60; saveProgress(); await showScreen('title20Earned') }
  else if (currentScreen === 'title20Earned')     { lastBuiltIsExplore = false; await showScreen('upgrade') }

  else if (currentScreen === 'trollGreet')        { enterCombat(false); lastBuiltIsExplore = false; await showScreen('combat') }
  else if (currentScreen === 'bossGreet')         { enterCombat(true);  lastBuiltIsExplore = false; await showScreen('combat') }
  else if (currentScreen === 'bossVictory')       { await showScreen('bossReward') }
  else if (currentScreen === 'bossReward')        { lastBuiltIsExplore = false; await showScreen('forestExplore') }

  // ── COMBAT ──────────────────────────
  else if (currentScreen === 'combat') {
    if (isSwipeUp) { await showScreen('combatMenu') }
    else if (isSwipeDown) {
      isDefending = true
      if (chance(80)) { defendSucceeded = true;  lastPlayerAttack = randomFrom(playerDefends);     await showScreen('playerDefend') }
      else            { defendSucceeded = false; lastPlayerAttack = randomFrom(playerDefendFails); await showScreen('playerDefendFail') }
    } else if (isDoubleTap) {
      if (!powerUsed) {
        powerUsed = true
        if (chance(95)) {
          lastPlayerAttack = randomFrom(playerPowers)
          const bossPowerBonus = isBossFight && getBossPhase() === 3 ? 1 : 0
          const damage = 2 + (attackBonus > 0 ? 1 : 0) + bossPowerBonus
          if (isBossFight) bossShielded = false
          if (gargoyleStoned) { gargoyleStoned = false }  // power breaks stone
          enemyCurrentHP -= damage
          if (enemyCurrentHP < 0) enemyCurrentHP = 0
          await showScreen('playerPower')
        } else { lastPlayerAttack = randomFrom(playerPowerMisses); await showScreen('playerPowerMiss') }
      } else {
        if (chance(90)) {
          if (bansheeStunned) { bansheeStunned = false; lastPlayerAttack = 'Still stunned! Miss!'; await showScreen('playerMiss') }
          else if (gargoyleStoned) { lastPlayerAttack = 'Hits stone! No dmg!'; await showScreen('playerHit') }
          else if (isBossFight && bossShielded) { bossShielded = false; lastPlayerAttack = 'Shield shattered!'; await showScreen('playerHit') }
          else {
            lastPlayerAttack = randomFrom(playerAttacks)
            enemyCurrentHP -= dealDamage()
            if (enemyCurrentHP < 0) enemyCurrentHP = 0
            await showScreen('playerHit')
          }
        } else { lastPlayerAttack = randomFrom(playerMisses); await showScreen('playerMiss') }
      }
    } else if (isTap) {
      if (bansheeStunned) { bansheeStunned = false; lastPlayerAttack = 'Stunned! Miss!'; await showScreen('playerMiss') }
      else if (chance(90)) {
        if (gargoyleStoned) { lastPlayerAttack = 'Hits stone! No dmg!'; await showScreen('playerHit') }
        else if (isBossFight && bossShielded) { bossShielded = false; lastPlayerAttack = 'Shield shattered!'; await showScreen('playerHit') }
        else {
          lastPlayerAttack = randomFrom(playerAttacks)
          enemyCurrentHP -= dealDamage()
          if (enemyCurrentHP < 0) enemyCurrentHP = 0
          await showScreen('playerHit')
        }
      } else { lastPlayerAttack = randomFrom(playerMisses); await showScreen('playerMiss') }
    }

  } else if (currentScreen === 'combatMenu') {
    if (isTap) {
      if (potionCount <= 0) { await showScreen('combatMenu') }
      else { potionCount--; playerHP = Math.min(playerHP + 2, maxPlayerHP); saveProgress(); await showScreen('combat') }
    } else if (isSwipeUp)   { await showScreen('fleeConfirm') }
    else if (isSwipeDown)   { await showScreen('combat') }

  } else if (currentScreen === 'fleeConfirm') {
    if (isTap)            { isBossFight = false; lastBuiltIsExplore = false; await showScreen(getReturnScreen()) }
    else if (isSwipeDown) { await showScreen('combat') }

  } else if (['playerHit','playerMiss','playerDefend','playerDefendFail','playerPower','playerPowerMiss'].includes(currentScreen)) {
    await handleEnemyTurn()

  } else if (currentScreen === 'enemyAttack') {
    await handleCombatContinue()

  } else if (currentScreen === 'victory') {
    lastBuiltIsExplore = false; await showScreen(getReturnScreen())

  } else if (currentScreen === 'dead') {
    applyDeathPenalty(); lastBuiltIsExplore = false
    if (questPhase >= 30) await showScreen('dungeonExplore')
    else if (questPhase >= 21) await showScreen('swampExplore')
    else if (questPhase >= 6) await showScreen('forestExplore')
    else await showScreen('explore')
  }
}

// ═══════════════════════════════════════
// MAIN
// ═══════════════════════════════════════

async function main() {
  loadProgress()
  setStatus('Connecting...')
  const raw = await waitForEvenAppBridge()
  bridge = raw as any
  setStatus('Connected!')
  bridge.onEvenHubEvent((event: unknown) => { handleInput(event) })

  try {
    if (localStorage.getItem('wp_autoload') === '1') {
      localStorage.removeItem('wp_autoload')
      playerHP = maxPlayerHP
      playerX = 3; playerY = 5
      forestPlayerX = 3; forestPlayerY = 9
      swampPlayerX = 3; swampPlayerY = 9
      dungeonPlayerX = 3; dungeonPlayerY = 9
      lastBuiltIsExplore = false
      if (questPhase >= 30)      await showScreen('dungeonExplore')
      else if (questPhase >= 21) await showScreen('swampExplore')
      else if (questPhase >= 6)  await showScreen('forestExplore')
      else                       await showScreen('explore')
      return
    }
  } catch (e) {}

  await showScreen('title')
}

main()