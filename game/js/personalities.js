/**
 * 人格数据文件 - 8种中世纪人格
 * 《如何成为一个优雅的中世纪人》H5小游戏
 */
const PERSONALITIES_DATA = [
  {
    id: 'noble',
    name: '宫廷贵族',
    subtitle: '舞会上的权谋舞者',
    cardImage: '../人格卡牌图/宫廷贵族.jpg',
    minScore: 92,
    maxScore: 100,
    color: '#8B1A1A',
    quote: '权力是最好的香水，而我只在正确的脉搏点涂抹。',
    traits: ['权谋', '精致', '野心', '掌控'],
    description: '你生在权力中心，精通每一种社交密码。你的优雅是精心计算的艺术——从扇子的开合角度到每一句恭维的分寸。你在舞池中旋转，也在棋盘上落子，将人际关系编织成权力的网络。'
  },
  {
    id: 'knight',
    name: '荣耀骑士',
    subtitle: '圣殿前的银甲守护者',
    cardImage: '../人格卡牌图/荣耀骑士.jpg',
    minScore: 84,
    maxScore: 91,
    color: '#1E3A5F',
    quote: '我的剑为弱者而挥，我的心为荣誉而跳。',
    traits: ['正义', '勇敢', '自律', '忠诚'],
    description: '你身披银甲，手持长剑，是骑士精神的化身。你的优雅源于钢铁般的纪律与对荣誉的绝对忠诚。你不仅守护领土，更守护中世纪的道德准则——谦卑、荣誉、牺牲、英勇。'
  },
  {
    id: 'sage',
    name: '智慧贤者',
    subtitle: '修道院里的烛光守望者',
    cardImage: '../人格卡牌图/智慧贤者.jpg',
    minScore: 76,
    maxScore: 83,
    color: '#4A3728',
    quote: '真理如烛光，虽微弱却足以照亮迷途。',
    traits: ['博学', '理性', '内敛', '远见'],
    description: '你隐居在修道院的回廊中，用羊皮纸记录星辰的轨迹。你的优雅不在于华服，而在于渊博的学识与冷静的判断。你信奉"知识即力量"，在烛光下与亚里士多德对话，用逻辑解构世界的奥秘。'
  },
  {
    id: 'monk',
    name: '隐修修士',
    subtitle: '静室中的灵魂耕作者',
    cardImage: '../人格卡牌图/隐修修士.jpg',
    minScore: 68,
    maxScore: 75,
    color: '#8B7355',
    quote: '真正的财富是无法被掠夺的——它住在心里。',
    traits: ['虔诚', '耐心', '奉献', '平和'],
    description: '你在修道院的菜园中劳作，在静室中抄写圣经。你的优雅是极简主义的极致——一粥一饭中的感恩，一笔一画中的专注。你不追求世俗荣耀，却在日复一日的虔诚中触摸永恒。'
  },
  {
    id: 'poet',
    name: '吟游诗人',
    subtitle: '酒馆中的琴弦编织者',
    cardImage: '../人格卡牌图/吟游诗人.jpg',
    minScore: 60,
    maxScore: 67,
    color: '#D4A017',
    quote: '世界是一首诗，而我只是恰好找到了韵脚。',
    traits: ['浪漫', '自由', '感性', '创意'],
    description: '你背着鲁特琴穿越王国，用歌谣记录历史与爱情。你的优雅在于将平凡化为传奇的能力。你在篝火旁讲述龙与公主的故事，让每个听众都相信自己可以成为英雄。'
  },
  {
    id: 'witch',
    name: '草药女巫',
    subtitle: '森林中的自然低语者',
    cardImage: '../人格卡牌图/草药女巫.jpg',
    minScore: 52,
    maxScore: 59,
    color: '#6B8E6B',
    quote: '大自然从不说谎，只是大多数人忘记了如何倾听。',
    traits: ['温柔', '直觉', '治愈', '神秘'],
    description: '你住在森林边缘的小屋，用月光与露水调配药剂。你的优雅是与自然和谐共处的智慧。你倾听风的低语，辨认每一片叶子的语言。村民既敬畏你又依赖你——你是治愈者，也是预言者。'
  },
  {
    id: 'merchant',
    name: '丝绸商贾',
    subtitle: '市集上的财富吟游者',
    cardImage: '../人格卡牌图/丝绸商贾.jpg',
    minScore: 44,
    maxScore: 51,
    color: '#2F8F8F',
    quote: '黄金流动的地方，就有文明在生长。',
    traits: ['精明', '冒险', '魅力', '务实'],
    description: '你牵着骆驼穿越丝绸之路，将东方的香料与西方的羊毛编织成财富。你的优雅在于将商业化为艺术的能力。你能在讨价还价中让双方都觉得自己赢了，用故事为商品镀金。'
  },
  {
    id: 'alchemist',
    name: '炼金术士',
    subtitle: '塔楼中的神秘探索者',
    cardImage: '../人格卡牌图/炼金术士.jpg',
    minScore: 36,
    maxScore: 43,
    color: '#6B4E8B',
    quote: '世界是一本密码书，而我正在破译它的字母表。',
    traits: ['好奇', '神秘', '专注', '叛逆'],
    description: '你隐居在高塔中，蒸馏瓶里沸腾着改变世界的秘密。你的优雅在于对未知的无畏探索。你不在乎教会的警告，只相信实验与观察。黄金？永生？不，你追求的是终极真理。'
  }
];

/**
 * 根据优雅值总分判定人格
 * @param {number} score - 优雅值总分
 * @returns {Object} 匹配的人格对象
 */
function getPersonality(score) {
  // 最低保底36分
  const finalScore = Math.max(36, Math.min(100, score));
  
  for (const p of PERSONALITIES_DATA) {
    if (finalScore >= p.minScore && finalScore <= p.maxScore) {
      return { ...p, finalScore };
    }
  }
  // 兜底：炼金术士
  return { ...PERSONALITIES_DATA[PERSONALITIES_DATA.length - 1], finalScore };
}
