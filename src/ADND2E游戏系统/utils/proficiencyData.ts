// 非武器熟练分组
export type ProficiencyGroup = 'general' | 'warrior' | 'wizard' | 'priest' | 'rogue';

// 非武器熟练接口
export interface NonweaponProficiency {
  id: string;
  name: string;
  englishName: string;
  group: ProficiencyGroup;
  slots: number; // 所需槽位数
  relatedAbility: string; // 相关属性（str/dex/con/int/wis/cha）
  checkModifier: number; // 检定调整值
  description: string; // 详细描述（包含使用规则、检定条件等）
}

// 非武器熟练数据（基于表37）
export const NONWEAPON_PROFICIENCIES: NonweaponProficiency[] = [
  // ==================== 通用类 ====================
  {
    id: 'agriculture',
    name: '农业',
    englishName: 'Agriculture',
    group: 'general',
    slots: 1,
    relatedAbility: 'int',
    checkModifier: 0,
    description:
      '角色拥有农业的基本知识，包括种植、收获、储存、照料动物、屠宰和其他典型的农活。这个熟练通常不需要进行检定，角色自然而然地知道如何完成这些农业任务。',
  },
  {
    id: 'animal-handling',
    name: '管理动物',
    englishName: 'Animal Handling',
    group: 'general',
    slots: 1,
    relatedAbility: 'wis',
    checkModifier: -1,
    description:
      '这方面的熟练能够让角色管理超出正常范围的群居动物和驮畜。成功的熟练检定将意味着角色成功地让兴奋或者不安的动物平静下来。另一方面，没有此熟练的角色只有20%的几率在该尝试中成功。',
  },
  {
    id: 'animal-training',
    name: '训练动物',
    englishName: 'Animal Training',
    group: 'general',
    slots: 1,
    relatedAbility: 'wis',
    checkModifier: 0,
    description:
      '拥有该熟练的角色可以训练一种生物（取决于他选择的熟练对应生物种类）来完成简单的命令和行动。角色可以额外使用一个熟练槽来训练另外一个种类的生物，或者增强他对已选择的生物种类的训练能力。通常可以训练的生物是狗、马、鹰、鸽子、大象、雪貂和鹦鹉。角色可以选择更多的异国动物、怪物和有智能的动物来训练（虽然它们会更难被控制）。\n\n一个训练师能够同时训练三个生物。训练师可以选择教导普通的工作或者特殊的技巧。普通工作能够让生物响应一系列的非特殊命令以完成它的工作，这些命令包括守卫、攻击、驮人、进行重体力劳动、狩猎、追踪或者和战士并肩战斗（例如一匹战马或者大象）。而特殊技巧则会让该生物学会一个特定的行动，马也许在听到命令后会人立而起，猎鹰可能会捕猎特定的物体，狗可能会攻击一个特定的人，或者老鼠可能会通过特定的迷宫。只要有足够的时间，生物就可以通过训练来完成普通工作或者特殊技巧。\n\n教会动物学会普通工作需要3个月的不间断训练。训练特殊技巧则需要2d6周。在训练结束的时候进行熟练检定，成功则该生物学会了训练的内容，失败则该野兽无法被训练。每只动物都可以学会2d4个普通工作或者特殊把戏，或者两者兼而有之。',
  },
  {
    id: 'artistic-ability',
    name: '艺术才能',
    englishName: 'Artistic Ability',
    group: 'general',
    slots: 1,
    relatedAbility: 'wis',
    checkModifier: 0,
    description:
      '拥有艺术才能的玩家角色会自然而然地熟悉各种艺术。他们对色彩、形式、空间、流畅（谈话或文体等）、声调、音高和节拍有着内在的理解。拥有艺术才能的角色必须选择一种艺术形式（例如绘画、雕刻、作曲等）以掌握。此后，他们可以试着在他们所选定的艺术范畴内创造艺术作品或者乐谱。尽管并不必须进行熟练检定，但它可以确定工作的质量。如果在检定中掷出1，则创造出了那些真正能够流传的艺术品。如果检定失败，则该艺术家创造了一些在风格上让人反感的艺术品，或者只是单纯地画得很糟糕。\n\n艺术才能同样让角色在所有与艺术有关的熟练检定上获得+1奖励——比如音乐和舞蹈，以及鉴定艺术品。',
  },
  {
    id: 'blacksmithing',
    name: '锻造',
    englishName: 'Blacksmithing',
    group: 'general',
    slots: 1,
    relatedAbility: 'str',
    checkModifier: 0,
    description:
      '拥有锻造熟练的角色熟于使用钢铁炼制工具。使用该熟练需要一个烧炭的锻炉和风箱，以及锤子和铁砧。角色不能够制造护甲或者大多数武器，但他能够打造撬棍、铁钩、马蹄铁、钉子、铰链、犁和其他的大部分铁制品。',
  },
  {
    id: 'brewing',
    name: '酿造',
    englishName: 'Brewing',
    group: 'general',
    slots: 1,
    relatedAbility: 'int',
    checkModifier: 0,
    description:
      '角色受过酿造啤酒或者其他烈性饮料的技艺训练。角色可以准备酿造配方，精选优质的原料，建立并且管理一个酿造厂，控制发酵的过程和成品的年份。',
  },
  {
    id: 'carpentry',
    name: '木工',
    englishName: 'Carpentry',
    group: 'general',
    slots: 1,
    relatedAbility: 'str',
    checkModifier: 0,
    description:
      '该熟练让角色能够做木工的工作：建房子、造家具、细木工等等。当然，必须要有材料和工具。角色能够通过其经验而不需要设计图来制作一些基础的物品。不寻常或更加复杂的物品（比如投石车）需要由工程师准备的设计图。而那些最不寻常或高度复杂的物品（比如木质发条式机械）则需要熟练检定。',
  },
  {
    id: 'cobbling',
    name: '补鞋',
    englishName: 'Cobbling',
    group: 'general',
    slots: 1,
    relatedAbility: 'dex',
    checkModifier: 0,
    description: '角色能够制造并修理鞋子、靴子和凉鞋。',
  },
  {
    id: 'cooking',
    name: '烹饪',
    englishName: 'Cooking',
    group: 'general',
    slots: 1,
    relatedAbility: 'int',
    checkModifier: 0,
    description:
      '尽管所有的角色都有基本的烹饪技巧，但只有拥有该熟练的角色才能被称之为成功的厨师。只有在试图作为大厨烹饪一顿大餐时，才需要进行熟练检定。',
  },
  {
    id: 'dancing',
    name: '舞蹈',
    englishName: 'Dancing',
    group: 'general',
    slots: 1,
    relatedAbility: 'dex',
    checkModifier: 0,
    description: '角色了解很多形式的舞蹈，从民间舞蹈到正式的宫廷舞。',
  },
  {
    id: 'direction-sense',
    name: '方向感',
    englishName: 'Direction Sense',
    group: 'general',
    slots: 1,
    relatedAbility: 'wis',
    checkModifier: 1,
    description:
      '拥有该熟练的玩家有着与生俱来的方向感。角色能够通过专注1d6轮来试着辨别方向。如果检定失败但低于20，那么角色做出了90°的误判。如果掷出了20，则判断的方向和实际方向完全相反（由DM掷骰子决定）。\n\n此外，当在野外的时候，拥有方向感的玩家迷路的几率降低5%。',
  },
  {
    id: 'etiquette',
    name: '礼仪',
    englishName: 'Etiquette',
    group: 'general',
    slots: 1,
    relatedAbility: 'cha',
    checkModifier: 0,
    description:
      '该熟练能够让角色对在不同场合下的行为方式和谈吐需求具备恰当的基本了解，尤其是涉及贵族或者地位较高的人的时候。因此，角色会知道使用正确的头衔来称呼公爵，以步骤正确的仪式来迎接到访的外交官，应当避免在矮人面前使用的手势等。对于那些非常罕见的情况，角色必须要进行熟练检定来确定他是否了解在该情况下使用的正确礼仪（例如帝国的到访就非常罕见）。\n\n然而，角色"知道什么是正确的"和"实际上做什么才是正确的"是两件不同的事情。角色仍然应当进行角色扮演来应对遭遇。礼仪知识并不会让角色免于出丑；很多人知道该如何做，但是事实上却做了截然相反的事情。',
  },
  {
    id: 'fire-building',
    name: '生火',
    englishName: 'Fire-building',
    group: 'general',
    slots: 1,
    relatedAbility: 'wis',
    checkModifier: -1,
    description:
      '拥有生火熟练的玩家不需要通过火绒箱来生火。只需要一些干木头和一点火绒，他能够在无需燧石或者钢片的情况下在2d20分钟内成功生火。湿木头、大风或者其他不利条件会让时间增加3d20。在生火时必须要进行一次成功的熟练检定。',
  },
  {
    id: 'fishing',
    name: '钓鱼',
    englishName: 'Fishing',
    group: 'general',
    slots: 1,
    relatedAbility: 'wis',
    checkModifier: -1,
    description:
      '熟练于钓鱼的角色能够通过钩子和线、网、或者鱼叉来捕鱼。角色在捕鱼的每个小时都要进行一次熟练检定，失败则他并没有捕到任何鱼。此外，钓鱼或者叉鱼的收获量等于骰子结果和角色的灵知之差，用网捕鱼的收获量为此值的三倍。\n\n当然，在那些没有鱼的地方是没法捕鱼的。另一方面，有的地方——比如产卵季的河流或者池塘——盛产鱼类。DM可以调整在这些情况下的收获。',
  },
  {
    id: 'heraldry',
    name: '纹章学',
    englishName: 'Heraldry',
    group: 'general',
    slots: 1,
    relatedAbility: 'int',
    checkModifier: 0,
    description:
      '纹章只是让角色能够分辨纹章和符号所代表的人或者组织。纹章的形式和目的各不相同。纹章学可以用来分辨贵族、家庭、行会、教派、军团、政治派别和血统。符号可能出现在旗帜、盾牌、头盔、徽章、刺绣、立柱、衣服、货币，乃至更多的地方上。所使用的符号可能包括几何图案、书法字迹、奇异野兽、宗教符文，以及魔法印记（用于识别）。纹章有着不同的区别，从高度形式化的规则以及欧洲中世纪末期的法规，到盾牌图案和样式各不相同的非洲部落。\n\n角色会自然而然地知道他的家乡中纹章之间的不同以及分别代表了谁。另外，如果角色成功地通过熟练检定，他可以依靠他遇到过的一个异地来客所提供的知识而正确地识别其他地方的标志和符号。他的纹章学知识在他第一次踏入某片外国土地时并没有多少用处。',
  },
  {
    id: 'languages-modern',
    name: '当代语言',
    englishName: 'Languages, Modern',
    group: 'general',
    slots: 1,
    relatedAbility: 'int',
    checkModifier: 0,
    description:
      '角色学会了说一种世上已知的语言。要这么做，他首先得有个老师。这个老师可能是另一个角色、一个雇佣的NPC，或者只是一个当地居民。',
  },
  {
    id: 'leatherworking',
    name: '制皮',
    englishName: 'Leatherworking',
    group: 'general',
    slots: 1,
    relatedAbility: 'int',
    checkModifier: 0,
    description:
      '该熟练让角色能够鞣制和处理皮革，并将其制成衣物或其他皮革制品。角色能够制造皮革护甲、背包、鞍囊、马鞍，以及其他各种马具。',
  },
  {
    id: 'mining',
    name: '采矿',
    englishName: 'Mining',
    group: 'general',
    slots: 2,
    relatedAbility: 'wis',
    checkModifier: -3,
    description:
      '一个拥有采矿熟练的角色需要现场监督任何矿山的经营。首先，该角色可以尝试确定在给出的区域内能找到哪种矿石或者宝石。要这么做，他至少要花一周的时间来搜索一片四平方英里的地区。DM可以判定必须在更广阔的区域才能找到那些有价值的东西，从而增加搜索所需要的时间。在搜索结束时，角色可以假设这个地区很可能会找到什么东西。在此之后，角色可以开始采矿。成功的熟练检定（由DM进行）将使角色找到在该区域最适合采矿的地点，检定并不能保证成功找到矿点，这个特殊的地点只是一个在指定区域内的最佳选择。DM必须决定能够找到哪种矿藏（如果有的话）。如果检定失败，那么角色只是觉得他找到了一个好地方。当然，在角色发现他错了之前会浪费很多时间。\n\n一旦开始经营矿山，拥有采矿熟练的角色就必须留在现场监督所有工作。大多数角色会发现将这个工作托付给专管本方面的NPC会更好，因为这是一份稳定的工作。',
  },
  {
    id: 'pottery',
    name: '制陶',
    englishName: 'Pottery',
    group: 'general',
    slots: 1,
    relatedAbility: 'dex',
    checkModifier: -2,
    description:
      '拥有此熟练的角色能够制造在战役世界的生活中常用的陶器或者粘土容器。角色需要一个转轮和一个瓷窑，还要提供粘土和釉料。一般而言，角色每天能够制造两个小型或者中型的物品，或者一个大型的物品。陶器必须在窑中额外烧一天。\n\n涉及的成本中，小型的需要消耗3cp，中型的需要消耗5cp，而大型的则需要1sp。',
  },
  {
    id: 'riding-airborne',
    name: '空中骑乘',
    englishName: 'Riding, Airborne',
    group: 'general',
    slots: 2,
    relatedAbility: 'wis',
    checkModifier: -2,
    description:
      '角色经受了骑乘飞行坐骑的训练。在选定本熟练时必须指定特定的坐骑。额外的熟练槽可以用来学习如何骑乘其他类型的飞行坐骑。和陆地骑乘不同，角色必须拥有本熟练（或者和另一个拥有本熟练的人同乘一骑）才能骑乘一只飞行坐骑。\n\n此外，一个熟练于空中骑乘的角色能够进行以下行动：以单个行动跳上该生物的鞍座上（当它站在地面上时）并且驾驭它行动；从当前飞行坐骑的背上跳下去，下坠10英尺之后落在另一个坐骑上（需要熟练检定）；骑手通过成功的检定可以让他的坐骑增加1d4的移动力，持续4轮；骑手能够以自己的膝盖和脚来引导坐骑，让他的双手放空。',
  },
  {
    id: 'riding-land',
    name: '陆地骑乘',
    englishName: 'Riding, Land-Based',
    group: 'general',
    slots: 1,
    relatedAbility: 'wis',
    checkModifier: 3,
    description:
      '拥有本熟练的角色可精通骑乘、驾驭马匹或者其他种类的坐骑。当学习本熟练时，角色必须选择他熟练于骑乘的是哪种类型的坐骑。可选范围包括狮鹫、独角兽、凶暴狼以及能够被人类、亚人、或者类人生物所骑乘的绝大多数坐骑。\n\n拥有骑乘熟练的角色能够完成以下行动：在坐骑静止站立时，角色能够跳上马鞍；角色能够驱策坐骑跳过障碍物和跨越间隙（需要检定）；角色能够驱策他的坐骑让它速度变得更快；角色可以用膝盖引导他的坐骑，让他能够在骑乘时使用需要双手的武器；角色能够翻身悬挂在坐骑的一侧，以它作为盾牌对抗攻击；角色可以从坐骑上跳下来并且对10英尺内的敌人进行一次近战攻击。',
  },
  {
    id: 'rope-use',
    name: '绳艺',
    englishName: 'Rope Use',
    group: 'general',
    slots: 1,
    relatedAbility: 'dex',
    checkModifier: 0,
    description:
      '该熟练允许玩家用绳子完成惊人的技艺。拥有本熟练的角色熟悉所有种类的打结方式，能让绳结松开、绑紧、缓慢地滑动，或者一拽就松开。如果角色的双手被绳结捆住，他能通过一次承受-6惩罚的熟练检定来逃脱。\n\n角色在使用套索的攻击时获得+2的奖励。他在使用自己准备的绳子进行攀爬检定时获得10%的奖励，该奖励同样可以用于试图保护同伴（将他们绑在登山绳索的末端）时。',
  },
  {
    id: 'seamanship',
    name: '航海术',
    englishName: 'Seamanship',
    group: 'general',
    slots: 1,
    relatedAbility: 'dex',
    checkModifier: 1,
    description:
      '角色熟悉船和小艇。他能够胜任船员的工作，虽然他不能驾船。经过海员训练的船员能够管理任何类型的船只，并且让船只在内河的移动力增加50%。',
  },
  {
    id: 'seamstress-tailor',
    name: '裁缝',
    englishName: 'Seamstress/Tailor',
    group: 'general',
    slots: 1,
    relatedAbility: 'dex',
    checkModifier: -1,
    description:
      '角色能够缝纫和设计服装。他同样能够做各种刺绣和装饰。尽管不需要熟练检定，但角色至少要有针线来完成工作。',
  },
  {
    id: 'singing',
    name: '唱歌',
    englishName: 'Singing',
    group: 'general',
    slots: 1,
    relatedAbility: 'cha',
    checkModifier: 0,
    description:
      '拥有本熟练的角色是一个多才多艺的歌手并能够以此娱乐别人，他也许能够籍此赚一小笔生活费（请注意，诗人本身就可以这么做）。唱歌不需要进行任何熟练检定。角色在通过熟练检定后能够创作合唱作品。',
  },
  {
    id: 'stonemasonry',
    name: '石匠',
    englishName: 'Stonemasonry',
    group: 'general',
    slots: 1,
    relatedAbility: 'str',
    checkModifier: -2,
    description:
      '石匠能够建造那些能够保持很多年的建筑。他能够做简单的石雕，比如刻字、石柱和花纹。石头可以是浆砌、无浆精砌，或松装以及少量的岩石和泥土。只要提供的石块已经被切割打磨好，一个拥有工具（锤子、凿、楔子、滑轮组）的石匠能够在一天内建起一座5英尺高、1英尺厚、10英尺长的墙。石匠同样能够监督其他没有本熟练的工人采石，每五个工人需要一个石匠。矮人是世界上最熟练的石匠，他们在使用本技能时获得+2奖励。',
  },
  {
    id: 'swimming',
    name: '游泳',
    englishName: 'Swimming',
    group: 'general',
    slots: 1,
    relatedAbility: 'str',
    checkModifier: 0,
    description:
      '拥有游泳熟练的角色知道如何游泳，以及如何通过游泳规则中提到的方式移动（第十四章：时间和移动）。没有本熟练的角色无法游泳。他们能够屏气和漂浮，但是不能在水中自行移动。',
  },
  {
    id: 'weather-sense',
    name: '观测天气',
    englishName: 'Weather Sense',
    group: 'general',
    slots: 1,
    relatedAbility: 'wis',
    checkModifier: -1,
    description:
      '这个熟练能使得角色通过知识来猜测即将到来的天气情况。成功的熟练检定意味着角色能够准确地猜测六小时后的大致天气情况。失败的检定会使角色读出错误的信号，使其不能准确预测天气。DM必须秘密掷出检定。每六小时能做一次熟练检定。然而，通过每六小时的观察，角色的能力检定会获得+1的奖励（当他看到天气变化时，角色对即将到来的天气感知会变得更灵敏）。这些变化会累计，虽然睡眠或者占用角色长时间注意力的活动会取消那些累计的奖励。\n\n有时危险的天气情况是如此的明显，以至于不需要熟练检定。很难才会让人不注意到穿过平原的龙卷风或者角色前方地平线上的乌云。在这些情况下，玩家应该能够推论出他的角色将要面对什么。',
  },
  {
    id: 'weaving',
    name: '编织',
    englishName: 'Weaving',
    group: 'general',
    slots: 1,
    relatedAbility: 'int',
    checkModifier: -1,
    description:
      '拥有编织熟练的角色能够制造服装、挂毯、羊毛或者棉花织物，角色需要一台纺纱机和一台织布机。每个织工每天能织造两平方码的织物。',
  },

  // ==================== 祭司类 ====================
  {
    id: 'ancient-history-priest',
    name: '古代历史',
    englishName: 'Ancient History',
    group: 'priest',
    slots: 1,
    relatedAbility: 'int',
    checkModifier: -1,
    description:
      '角色知道一些古代时间和地点的传奇、传说和历史。这些知识必须有指向性，如同现代的史学家可能会专注于英国中世纪、意大利文艺复兴或者凯撒之前的罗马共和国一样（DM既可以自行设定游戏世界的古代历史，也可以让角色对其进行命名和设定）。因此，玩家可能会知道任何允许被知道的历史，从龙王之心时代到海骑士时代或者其他历史。\n\n这些被获得的知识将使角色熟悉于那些著名的传奇、历史事件、角色、地理、战役、突破（包括科技的、文化的或者魔法的）、未解之谜、工艺品和那个时代的特点。角色必须进行熟练检定以确定他是否能认出他所接触的与那个时代相关的地点或者物品。',
  },
  {
    id: 'astrology',
    name: '占星术',
    englishName: 'Astology',
    group: 'priest',
    slots: 2,
    relatedAbility: 'int',
    checkModifier: 0,
    description:
      '该熟练让角色能够一定程度地理解群星产生的影响。在知道某人的出生日期和时间后，星象家可以通过研究天空与群星的事件来预测他的未来。占星家只能预测接下来三十天内的未来，且他只能了解到模糊空洞的东西。如果熟练检定成功，那么占星家就可以预见一些重大事件——一场伟大的战役、失去一个朋友、建立新的友谊等等。DM来决定这些预测的准确性（基于他对接下来游戏进程的安排）。注意，预测并不能够保证必然发生，它只是展示了某种可能性。熟练检定失败则无法获得任何信息。如果掷出了20，那么预测会变得不准确。\n\n显然，这种熟练需要DM进行提前准备这方面的专业知识。因此，DM回避提出的问题是可以的，虽然他不应该每次都回避这些问题。那些希望他的DM能够更轻松地带团（这通常是个好主意）的玩家应该考虑在游戏的每次结束时使用这个熟练。DM可以通过该熟练来作为催化剂来引导他的冒险——它会引导PC前往某个地方或尝试某个新鲜事物。\n\n只要能够看到星星，那么角色就能因熟练于占星术而在导航的熟练检定上获得+1的奖励。',
  },
  {
    id: 'engineering',
    name: '工程学',
    englishName: 'Engineering',
    group: 'priest',
    slots: 2,
    relatedAbility: 'int',
    checkModifier: -3,
    description:
      '该角色被培养成为大大小小物品的建造者。工程师能准备从简单的机械图纸（弩炮、河上的船闸、谷物磨坊）到巨大的建筑物（堡垒、水坝）。只有在需要设计某些特别复杂或者不寻常的东西时才需要进行熟练检定。工程师必须要找到有才干的工人才能将他的设计付诸实现，但他也非常熟悉监督和管理工作。\n\n一个工程师同样熟悉攻城器械的原理，能够找到城堡防御的缺陷或做到类似的事情。他知道如何制造和使用攻城器械和机械，比如弩炮、攻城锤和螺旋钻。',
  },
  {
    id: 'healing',
    name: '医疗',
    englishName: 'Healing',
    group: 'priest',
    slots: 2,
    relatedAbility: 'wis',
    checkModifier: -2,
    description:
      '拥有医疗熟练的人知道如何使用自然的药草，以及急救和行医的基本方法。如果角色在其他人受伤的同一轮内对他进行医疗（并成功通过熟练检定），他将治疗伤者的1d3点伤害（但生命值不能恢复到比受到伤害前更多的状态）。每个角色每天只能被尝试医疗一次。\n\n如果一个受伤的角色在其他具有医疗熟练的人照料下，角色即使在旅行或者进行不费力的行动时也可以每天恢复1点伤害。如果受伤的角色获得良好的休息，那么他能够每天恢复2点伤害。只有同时拥有药草学和医疗熟练的人可以帮助其他人每天恢复3点伤害。这种护理不需要熟练检定，只需要拥有该熟练的人定期照顾病人。角色能够随时看护最多六名伤患。\n\n一个拥有医疗熟练的人还可以试着帮助一个中毒的个体，如果毒素是通过伤口进入患者体内的话。如果中毒的角色能够在当场（在他中毒后的一轮内）得到护理并且持续照料此后5轮，则受害者在他的豁免骰上获得+2奖励（直到护理的最后一轮再进行豁免检定，而不是当场掷骰）。这无需进行熟练检定，但是中毒者必须立即得到治疗（通常通过医疗者放弃他的任何其他行动）并且他本人不能做任何事情。如果治疗和休息被打断，中毒的角色必须立刻对毒素进行豁免检定。该豁免将正常进行而角色不会得到检定的奖励（即治疗并没有起效）。只有角色在同时拥有治疗和药草学熟练的情况下才能够试着治疗那些因为接触或者吞咽而中毒的人（角色使用他的治疗以确定中毒而通过药草学清除毒素）。\n\n一个拥有医疗熟练的人同样可以试着治疗疾病。当治疗普通的疾病时，成功的熟练检定会使疾病导致的伤痛降到最低并只持续最短的时间。那些同时拥有药草学熟练的人在检定上获得+2奖励。拥有该熟练的角色也可以尝试诊断法术或生物引发的魔法疾病。这种情况下，一个成功的熟练检定会诊断出病因。但是考虑到这些疾病本质上是魔法，所以只能通过魔法手段治疗。',
  },
  {
    id: 'herbalism',
    name: '药草学',
    englishName: 'Herbalism',
    group: 'priest',
    slots: 2,
    relatedAbility: 'int',
    checkModifier: -2,
    description:
      '拥有药草学知识的角色能识别植物和真菌，并能够制作非魔法性的药剂、药膏、药粉、香膏、油膏、软膏、注射液，以及医用和伪医学用途的膏药。他们同样可以准备自然植物毒素和泻剂。DM必须决定这些基于DMG毒素规则的确切效果。同时拥有药草学和医疗熟练的角色可以在医疗熟练获得奖励（参见医疗熟练）。',
  },
  {
    id: 'languages-ancient',
    name: '古代语言',
    englishName: 'Languages, Ancient',
    group: 'priest',
    slots: 1,
    relatedAbility: 'int',
    checkModifier: 0,
    description:
      '角色掌握了一种艰难晦涩，如今只能够在老学究和术士的著作中见到的语言。这种语言的主要用途是用于阅读那些死去多时的神秘家所著的古老的神秘书籍。该熟练能够让角色读写或者说这种语言（基于他的选择）。',
  },
  {
    id: 'local-history-priest',
    name: '本地历史',
    englishName: 'Local History',
    group: 'priest',
    slots: 1,
    relatedAbility: 'cha',
    checkModifier: 0,
    description:
      '角色通晓一个国家或者一个行省的区域历史。角色知道在山上的废弃的塔是谁在什么时候建造的（以及建造者发生了什么），某个伟大的英雄和敌人战斗并陨落在古老的战场上，本地的神殿应该藏有巨大的财宝，下一个镇子的市长是如何神奇地让秃头上长出了头发，或者更多。\n\nDM将提供本地的地址和事件给需要知道的角色。另外，角色能够试着作为趣事复述那些事件。一旦选择本熟练，他就可以通过成功的熟练检定而将传说加入自己的剧目中。他也可以将这个故事告诉其他角色。如果角色成功地引起了其他人的兴趣，那么其他人不需要进行熟练检定就可以记住这个故事。角色能将这些故事作为趣事来告诉其他人，在他的魅力上获得+2的奖励。不过跟敌人讲故事可不是个好主意。',
  },
  {
    id: 'musical-instrument-priest',
    name: '演奏乐器',
    englishName: 'Musical Instrument',
    group: 'priest',
    slots: 1,
    relatedAbility: 'dex',
    checkModifier: -1,
    description:
      '角色能够演奏特定的乐器。额外的熟练槽能够增强他在这方面的能力。角色可以做的很好，因此不需要进行检定。DM可以在他认为是特殊情况时让角色进行熟练检定。',
  },
  {
    id: 'navigation-priest',
    name: '导航',
    englishName: 'Navigation',
    group: 'priest',
    slots: 1,
    relatedAbility: 'int',
    checkModifier: -2,
    description:
      '角色通过星象、研究洋流、观察土地的迹象、珊瑚礁，以及隐藏的危险而学会了导航。本熟练在地面无法生效。在海洋上，熟练于导航的人进行的成功熟练检定能够让迷航的机会降低20%。',
  },
  {
    id: 'reading-writing',
    name: '阅读/书写',
    englishName: 'Reading/Writing',
    group: 'priest',
    slots: 1,
    relatedAbility: 'int',
    checkModifier: 1,
    description:
      '角色能够阅读和书写他所能说的一门当代语言，只要有人能够教他（另一个PC、一个雇工、或者一个NPC）。本熟练并不能让角色掌握古代语言（见古代语言）。',
  },
  {
    id: 'religion-priest',
    name: '宗教知识',
    englishName: 'Religion',
    group: 'priest',
    slots: 1,
    relatedAbility: 'wis',
    checkModifier: 0,
    description:
      '拥有宗教知识的角色知道常见的信仰以及他的家乡和附近地区的主要宗教信仰。任何宗教的普通信息（使用的宗教符号、基础教义，等等）自动被玩家知晓。特殊信息，比如牧师的组织构架或者某个圣日的意义，则需要进行熟练检定。\n\n在宗教知识上消耗的额外熟练让角色能够让他的一般知识扩展到更遥远的地区（指导方针见上）或者让他获悉某个宗教组织更明确的信息。如果选择了后者，角色不再需要检定就能够回答关于该信仰的问题。当在处理他们自己和对立的信仰时，这类知识对于祭司角色非常有用。',
  },
  {
    id: 'spellcraft-priest',
    name: '辨识法术',
    englishName: 'Spellcraft',
    group: 'priest',
    slots: 1,
    relatedAbility: 'int',
    checkModifier: -2,
    description:
      '尽管本熟练并不会让角色施展法术，但可以让角色辨识出被施展的法术之间形式和仪式的不同。如果角色看到或者听到某个人在施法，或者他检查了法术的材料成分，他能够试着辨识正在施展的魔法是什么。必须要进行熟练检定以辨识法术。专精法师在试图辨识出其学派魔法的检定上获得+3奖励。注意，因为必须在施法的瞬间仔细观察施法者，因此本熟练不会使角色在对抗战斗法术时给予他任何优势，但是这个熟练在辨认那些效果不可见的法术时很有用。\n\n那些拥有本熟练的人同样拥有（等于他们正常熟练检定的½）的几率来识别魔法或魔法能力的构造。',
  },

  // ==================== 游荡者类 ====================
  {
    id: 'ancient-history-rogue',
    name: '古代历史',
    englishName: 'Ancient History',
    group: 'rogue',
    slots: 1,
    relatedAbility: 'int',
    checkModifier: -1,
    description: '角色知道一些古代时间和地点的传奇、传说和历史。这些知识必须有指向性（见祭司类相同熟练描述）。',
  },
  {
    id: 'appraising',
    name: '估价',
    englishName: 'Appraising',
    group: 'rogue',
    slots: 1,
    relatedAbility: 'int',
    checkModifier: 0,
    description:
      '该熟练对于贼而言非常有用，它让角色能够评估古董、艺术品、首饰、切割过的宝石或者其它工艺物品的价值和真实性（尽管DM可以排除那些太过奇特和罕见以至于没什么人知道的）。角色必须将该物品拿在手中以进行评估。成功的熟练检定（由DM秘密掷骰子决定）让角色能够正确地评估出物品的价值，精确到百或者千位，并识别出赝品。失败的检定则意味着角色完全无法辨别出这个物品的价值。如果掷出20，则意味着角色对该物品的估价错得很离谱，这总会给角色带来损失。',
  },
  {
    id: 'blind-fighting-rogue',
    name: '盲斗',
    englishName: 'Blind-fighting',
    group: 'rogue',
    slots: 2,
    relatedAbility: 'none',
    checkModifier: 0,
    description:
      '拥有盲斗熟练的角色熟悉在微弱照明或无光的地方战斗（但不能通过该熟练使用法术）。在完全黑暗的环境中，角色的攻击检定只承受-2的惩罚（而无此熟练的人会受到-4的惩罚）。在星光或者月光下，角色只承受-1的惩罚。角色不会因为黑暗而在AC上受到惩罚。\n\n此外，角色保留那些在黑暗中会失去的特殊能力，虽然该特殊能力的效果降低一半（熟练检定的结果取正常的一半，诸如此类）。该熟练仅在角色紧靠着他攻击距离内的敌人或威胁时生效，它并不会让角色在对抗在角色近战范围之外的远程攻击或者其他效果时生效。因此，在对抗远程攻击时仍然要受到AC惩罚（例如，当角色听到箭响时，他已经来不及反应了）。\n\n当在黑暗中移动时，与那些没有该熟练的人比起来，角色只承受一半的速度惩罚。\n\n此外，该熟练也会帮助角色对抗那些隐形生物，使他的攻击惩罚降低到-2。然而，这并不会让角色发现隐形生物；他只是能够知道隐形生物的大概位置而不能精确地定位对方。',
  },
  {
    id: 'disguise',
    name: '易容',
    englishName: 'Disguise',
    group: 'rogue',
    slots: 1,
    relatedAbility: 'cha',
    checkModifier: -1,
    description:
      '拥有该熟练的玩家学会了易容的技艺。他能够让他自己看起来像是拥有同样身高、年龄、体重和种族的，一般类型的任何人。检定成功表明易容得很成功，而失败则意味着该尝试在某些地方露出马脚。\n\n角色同样能够易容成另一个种族或者性别。在这种情况下，他会承受-7的检定惩罚。角色也可以尝试将自己伪装成某个特定的人，在这种情况下则会受到-10的惩罚。这些调整是累计的，因此，角色想要扮成其他性别或者种族的某个特定人物是非常困难的（受到-17的惩罚）。',
  },
  {
    id: 'forgery',
    name: '伪造文书',
    englishName: 'Forgery',
    group: 'rogue',
    slots: 1,
    relatedAbility: 'dex',
    checkModifier: -1,
    description:
      '拥有该熟练的角色能伪造完全一样的文书或者签名，并且鉴定其他人所写的东西是否为伪造品。要想伪造那些不是由特定人物书写的的文书（军事命令、地方法令等），角色需要在其他地方见过类似的文件。要想伪造某人的签名，则需要那个人的签名并通过一次受到-2惩罚的熟练检定。要想伪造某人书写的一份较长的文书，那么将需要被伪造者的大量笔迹，并需要进行一次受到-3惩罚的熟练检定。\n\n需要注意的是，伪造者总是觉得自己的伪造是很成功的，因此DM需要秘密掷角色的熟练检定，而伪造者并不会发现自己可能出现的纰漏，直到事情无法挽回为止。\n\n如果检定成功，那么伪造的文件会通过所有人的检查，除了那些非常熟悉被模仿笔迹的人或那些拥有伪造文书熟练并且仔细检查了该文件的人。如果检定失败，伪造的文书会被所有熟悉该类型文件或者书写的人所识破——如果他近距离仔细检查该文件。如果掷出20，则该伪造文件不需要被近距离检查，而是只要拿起来就能发现有问题。伪造者并不会很晚才意识到这一点。\n\n此外，拥有伪造文书的角色可以检查一份文书是否为伪造的。成功的熟练检定能够弄清某份文件的可靠性。如果失败但没有掷出20，角色将会不确定这份文件的真伪。如果掷出了20，他会得出错误的结论。',
  },
  {
    id: 'gaming-rogue',
    name: '游戏',
    englishName: 'Gaming',
    group: 'rogue',
    slots: 1,
    relatedAbility: 'cha',
    checkModifier: 0,
    description:
      '角色懂得大多数类型的常见的运气型或者技术型的游戏，包括纸牌、骰子、骨牌、跳棋和国际象棋。在玩游戏的时候，角色能够进行实际的游戏（尽管太费时间）也能够以一个熟练检定略过，成功则胜利。如两个都拥有熟练的玩家对抗，掷出的骰子最成功的人胜利。拥有游戏熟练的人同样可以试着出千或作弊，且他将在检定中获得+1的奖励。然而，如果游戏的熟练检定结果为17至20，则意味着角色的出千或作弊被发现了（即使他在游戏中胜出）。',
  },
  {
    id: 'gem-cutting',
    name: '宝石切割',
    englishName: 'Gem Cutting',
    group: 'rogue',
    slots: 2,
    relatedAbility: 'dex',
    checkModifier: -2,
    description:
      '拥有此熟练的玩家每天可以雕琢1d10颗通过挖掘而被发现的原石。宝石匠不会从没有宝石切割熟练的人协助中获得任何帮助。宝石匠必须在良好的光源下使用各种各样的凿子、小锤子和特别坚硬的小刀来完成自己的工作。\n\n未切割的宝石同样拥有一定价值，但与完成品价格有所差别。如通过宝石切割检定成功了（通过熟练检定），宝石匠会使该宝石的价值根据宝石的种类而获得一定程度的提升。如果掷出1，则意味着工作非常成功并且该宝石成为了此类宝石中最为珍贵的艺术品（DM有相关的表格）。',
  },
  {
    id: 'juggling',
    name: '杂耍',
    englishName: 'Juggling',
    group: 'rogue',
    slots: 1,
    relatedAbility: 'dex',
    checkModifier: -1,
    description:
      '角色可以进行杂耍表演，可以用来进行表演、娱乐、分散注意力或者用于某些罕见的突发事件。当正常情况下（娱乐或者分散注意力）不需要进行熟练检定。当你在进行特殊的把戏时（"看我吃掉这个在空中的苹果！"）需要进行熟练检定。不过，杂耍同样能够让角色试着进行孤注一掷的行动。成功通过一次对抗AC 0的攻击检定（不是熟练检定），角色能够抓住掷向他的小东西（就像是向他掷东西让他接住一样）。因此，角色能够抓住尚未命中的匕首或者箭。如果该攻击检定失败，角色会自动受到伤害（把自己的手放在匕首坠落的路径上很容易受伤）。',
  },
  {
    id: 'jumping',
    name: '跳跃',
    englishName: 'Jumping',
    group: 'rogue',
    slots: 1,
    relatedAbility: 'str',
    checkModifier: 0,
    description:
      '角色可以试着进行垂直或者横向的卓异跳跃。如果角色进行了至少20英尺的助跑，他能够跳（跳远）2d6+他的等级每英尺远。没有角色能够跳的比自己身高的六倍更远。在同样的情况下，他能够跳（跳高）1d3+他每等级½英尺那么高。没有人能够跳高到自己1½倍身高以上。\n\n原地起跳的情况下，拥有本熟练的角色能够跳1d6+他每等级½英尺远，或只能跳到3英尺高。\n\n角色同样可以试着撑杆跳。撑杆跳需要一个至少30英尺的助跑。撑杆跳的跨度大约是杆的1½倍。角色能够抵达杆子那么高的地方。如果撑杆跳让他跨过了高度不超过他的杆子长度一半的障碍物，那么他可以试着通过自己的双脚着陆。',
  },
  {
    id: 'local-history-rogue',
    name: '本地历史',
    englishName: 'Local History',
    group: 'rogue',
    slots: 1,
    relatedAbility: 'cha',
    checkModifier: 0,
    description: '角色通晓一个国家或者一个行省的区域历史（见祭司类相同熟练描述）。',
  },
  {
    id: 'musical-instrument-rogue',
    name: '演奏乐器',
    englishName: 'Musical Instrument',
    group: 'rogue',
    slots: 1,
    relatedAbility: 'dex',
    checkModifier: -1,
    description: '角色能够演奏特定的乐器（见祭司类相同熟练描述）。',
  },
  {
    id: 'reading-lips',
    name: '读唇',
    englishName: 'Reading Lips',
    group: 'rogue',
    slots: 2,
    relatedAbility: 'int',
    checkModifier: -2,
    description:
      '角色可以理解那些能够看见但是无法听到的交谈。当选择本熟练时，玩家必须指定角色能够读唇的一门语言（本语言必须角色已经掌握）。要使用本熟练，角色必须在被读唇者30英尺以内并能够清晰地看到他在说话。进行一次熟练检定，失败则没有听到任何东西，成功则能够理解对话中70%的内容。因为某些声音无法被区分，因此读唇的效果永远不会比这更好。',
  },
  {
    id: 'set-snares',
    name: '设置陷阱',
    englishName: 'Set Snares',
    group: 'rogue',
    slots: 1,
    relatedAbility: 'dex',
    checkModifier: -1,
    description:
      '角色可以设置简单的陷阱来用于小规模狩猎。这些陷阱包括绳索圈套和弹簧陷阱等。在陷阱刚开始安装和每次设置时都必须进行熟练检定。失败则意味着因为某些原因而导致陷阱不能正常工作，可能是因为做工不好或者角色在陷阱位置留下了太多的气味，又或他的陷阱隐蔽性很差。这个问题的确切原因并不需要很清楚。角色也同样能够试着设置能够抓着更大东西的陷阱：比如老虎坑或者罗网。他必须要通过承受-4惩罚的熟练检定。在这两种情况下，成功设置陷阱并不意味着它能捉到任何东西，只是意味着陷阱能够正常工作。由DM来决定陷阱什么时候被触发。\n\n拥有本熟练的盗贼角色（并且只有盗贼角色）能够试着用陷阱对付人。这可能需要弩、大坑、尖刺踏板等。陷阱的运作方式和捕捉大型动物的陷阱相同。由DM决定这些对人陷阱造成的伤害。\n\n设置小型陷阱需要一个小时。设置大型陷阱需要两到三个人（只需要其中一个拥有熟练）和2d4小时。设置一个对人陷阱则需要一个或者更多人（基于它的类型）和1d8小时。要想准备任何陷阱，角色必须在手头拥有对应的适当材料。\n\n拥有动物知识熟练的角色在他们设置陷阱进行小规模狩猎时获得+2的奖励。他们关于动物和森林的知识让他们在这方面做得更好。他们在设置陷阱对付怪物和智慧生物时不会因此而获得奖励。',
  },
  {
    id: 'tightrope-walking',
    name: '走钢丝',
    englishName: 'Tightrope Walking',
    group: 'rogue',
    slots: 1,
    relatedAbility: 'dex',
    checkModifier: 0,
    description:
      '角色可以尝试在细长的绳索或者房梁上行走，并且成功几率远高于普通人。他能够在任何坡度不超过45°的狭窄表面上行走。角色每轮能够行走60英尺。每60英尺就需要进行一次熟练检定（或者不满60英尺），失败意味着坠落。如果表面宽度小于等于1英寸（比如绳子），那么他在检定上承受-10的惩罚。如果在2至6英寸则承受-5的惩罚，当表面宽度为7至12英寸不因此而受影响。表面宽度在1英尺以上时，则在正常情况下不需要进行任何检定。一个额外的熟练槽将使该熟练受到的惩罚减少1。使用平衡杆能够让惩罚减少2。风和钢丝的抖动等会额外让角色受到2至6的惩罚。\n\n角色能够试着在钢丝上战斗，但是他在攻击检定上必须承受-5的惩罚，且在每轮开始时需要进行熟练检定以防止坠落。由于角色无法大幅的动作，所以他的防御等级失去敏捷上的调整。如果他在绳索上时被击中，他必须立刻进行熟练检定以防止坠落。',
  },
  {
    id: 'tumbling',
    name: '翻滚',
    englishName: 'Tumbling',
    group: 'rogue',
    slots: 1,
    relatedAbility: 'dex',
    checkModifier: 0,
    description:
      '角色熟练于做任何类型的杂技动作——包括跳水、翻滚、空翻、倒立、跳跃等。只有当你轻负载或无负载时才可以进行翻滚。除了娱乐性之外，在战斗中的任何一轮，角色都可以通过翻滚来使自己的防御等级提高4点，该角色必须能够行动并且主动放弃在该轮的所有攻击。在徒手战斗时，他的攻击可以获得+2的奖励。\n\n如果成功通过熟练检定，当角色从60英尺或更低处坠落时受到的伤害减半，或者10英尺高的地方坠落而毫发无损。从更高处坠落将造成正常伤害。',
  },
  {
    id: 'ventriloquism',
    name: '腹语术',
    englishName: 'Ventriloquism',
    group: 'rogue',
    slots: 1,
    relatedAbility: 'int',
    checkModifier: -2,
    description:
      '角色能学到"抛弃他的声音"的秘密。虽然声音不是真的来自于其他地方（像法术一样），但这些角色能够欺骗其他人使其相信确实如此。使用腹语术时，声音的源头必须要非常靠近角色。发声物体的本质和观察者的智力会调整角色的成功率。如果角色使一个明显没有生命的物体发声（书籍、杯子等），他的熟练检定会承受-5的惩罚。如果他使一个可信的源头（PC或者NPC）发出声音，他的熟练检定会得到+2的奖励。观察者智力对检定的调整见规则（小于3：+6，3-5：+4，6-8：+2，9-14：0，15-16：-1，17-18：-2，19+：-4）。\n\n成功的熟练度检定意味着角色能成功的欺骗他的观众。每句话和回复都需要检定。角色被限于发出他平时发出的声音（因此狮子的咆哮有点超出他的能力范围）。\n\n因为腹语术基于人的语言知识并假设什么能说话和什么不能说话的前提下进行的欺诈，所以它仅对智慧生物时有效。因此腹语术对动物和类似生物毫无作用。此外，观众必须要观察角色，因为部分欺诈是来自于视觉的（"嘿，他的嘴唇没动！"）。使用腹语术并不会使人们看向他们身后，因为声音实际上并不是真的在他身后（这需要腹语术）。但那些孩子会轻易地相信真的发生了什么。他们也许会被逗乐，也许不会。',
  },

  // ==================== 勇士类 ====================
  {
    id: 'animal-lore',
    name: '动物知识',
    englishName: 'Animal Lore',
    group: 'warrior',
    slots: 1,
    relatedAbility: 'int',
    checkModifier: 0,
    description:
      '该熟练使角色能够通过观察动物的行为或者习惯来确定发生了什么。行为能够表明该生物有多危险，无论它是饥饿，是在保护自己的幼崽，或者保卫自己的巢穴。此外，仔细观察行为和习性甚至可以揭露水源的位置、动物的群落、捕食者乃至于即将到来的危险，比如森林火灾。DM会秘密掷熟练检定。如果成功，则意味着角色理解了生物的基本行为的意义所在。如果失败且低于4或以下，则不会获得任何信息。如果检定失败超过5，则角色会误解生物的行为。\n\n角色也可以模仿他所熟悉的动物的呼唤或哭叫声，只要基于他的背景而言是合理的。这种能力受限于体积。霸王龙的咆哮对于普通的角色来说是无法模仿的。成功的熟练检定意味着只有魔法才能将角色模仿的叫声和真正的动物叫声区分开来。模仿的叫声能够愚弄动物们，让它们因恐惧而逃窜或者引诱它们靠近。失败的检定则意味着声音在某些细节出现了问题。失败的模仿叫声检定仍然会愚弄一些动物，但那些对这种叫声非常熟悉的生物则会自然而然地发现这是一种假的叫声。所有的其他生物和角色都可以通过灵知检定来分辨叫声的真假。\n\n最后，动物知识可以让设置陷阱和下套（以狩猎野兽）的成功率增加，因为角色知道该生物觅食的一般习惯。',
  },
  {
    id: 'armorer',
    name: '制甲师',
    englishName: 'Armorer',
    group: 'warrior',
    slots: 2,
    relatedAbility: 'int',
    checkModifier: -2,
    description:
      '拥有该熟练的角色能够制造玩家手册中列出的所有护甲，只要拥有适当的材料和设备。当制作护甲时，在正常制造时间结束的时候进行熟练检定。\n\n制造护甲所需的时间为其AC与10之差每两周。举例而言，制造一面盾牌需要两周，而制造一套全身板甲则需要18周。如果熟练检定失败，但结果和护甲所需的成功点数之间差距在4或更低，则护甲师制造出了一件能够使用但有缺陷的护甲。这种类型的护甲比普通版的少1点AC，尽管它看起来和普通护甲没什么两样。只有拥有护甲师熟练的角色能够在仔细检查后发现这些缺陷。\n\n只要这种护甲在近战中被19或20的攻击检定击中，它就会损坏。该角色的AC直接减少4（尽管不会低于10），而且损坏的护甲会阻碍角色的移动。在角色脱掉坏掉的护甲前（需要1d4轮），角色的移动力降低至正常的½，他的所有攻击检定受到-4的惩罚。\n\n如果护甲师在制造一套野战板甲或者全身板甲，由于这种类型的护甲的部件都需要非常精确的配角，因此使用该护甲的角色在护甲制造过程中的每周都必须要来一次制造现场。',
  },
  {
    id: 'blind-fighting-warrior',
    name: '盲斗',
    englishName: 'Blind-fighting',
    group: 'warrior',
    slots: 2,
    relatedAbility: 'none',
    checkModifier: 0,
    description:
      '拥有盲斗熟练的角色熟悉在微弱照明或无光的地方战斗（但不能通过该熟练使用法术）。在完全黑暗的环境中，角色的攻击检定只承受-2的惩罚（而无此熟练的人会受到-4的惩罚）。在星光或者月光下，角色只承受-1的惩罚。角色不会因为黑暗而在AC上受到惩罚。此外，角色保留那些在黑暗中会失去的特殊能力，虽然该特殊能力的效果降低一半（熟练检定的结果取正常的一半，诸如此类）。该熟练仅在角色紧靠着他攻击距离内的敌人或威胁时生效，它并不会让角色在对抗在角色近战范围之外的远程攻击或者其他效果时生效。因此，在对抗远程攻击时仍然要受到AC惩罚（例如，当角色听到箭响时，他已经来不及反应了）。当在黑暗中移动时，与那些没有该熟练的人比起来，角色只承受一半的速度惩罚。此外，该熟练也会帮助角色对抗那些隐形生物，使他的攻击惩罚降低到-2。然而，这并不会让角色发现隐形生物；他只是能够知道隐形生物的大概位置而不能精确地定位对方。',
  },
  {
    id: 'bowyer-fletcher',
    name: '制弓师/制箭师',
    englishName: 'Bowyer/Fletcher',
    group: 'warrior',
    slots: 1,
    relatedAbility: 'dex',
    checkModifier: -1,
    description:
      '这个角色能够制造表44中列出的弓和箭。\n\n武器工匠只能做些制造箭头的工作，但制弓师/制箭师可以完成制弓箭的所有必要工作。制作长弓或者短弓需要一周的时间，复合弓则需要两周，而制造1d6支箭矢则需要一天时间。\n\n当制作完武器后，玩家要进行一次熟练检定。如果成功了，那么武器拥有正常的品质并且能够在正确使用的前提下使用好几年。如果失败了，武器仍然可以用但会有使用期限：只要角色在使用它时的1d20攻击检定中掷出1，弓就会断裂。\n\n可选：如果角色希望制造一件非常棒的武器而DM也同意，那么玩家能使用后面的熟练来决定他的成功度。当进行熟练检定时，任何失败都意味着该武器是无法使用的。然而，如果成功则意味着角色能够将自己的力量调整值加在攻击和伤害上。此外，如果该熟练检定掷出了1，那么任何类型的弓的射程增加10码，或者它是适合附魔的精制品。',
  },
  {
    id: 'charioteering',
    name: '驭车',
    englishName: 'Charioteering',
    group: 'warrior',
    slots: 1,
    relatedAbility: 'dex',
    checkModifier: 2,
    description:
      '拥有该熟练的角色能够安全地驾驶战车通过平常能够越过的任何类型的地形，无此熟练的人只能以1/3的速度来驾驶战车通过。注意这个熟练并不会让战车穿越它理论上无法穿越的地形，就算是最好的车夫也不能让车驶过群山。',
  },
  {
    id: 'endurance',
    name: '坚忍',
    englishName: 'Endurance',
    group: 'warrior',
    slots: 2,
    relatedAbility: 'con',
    checkModifier: 0,
    description:
      '在受到疲乏和力竭的影响前，拥有坚忍熟练的角色能够进行两倍时长于普通角色的剧烈运动。在这种情况下，极端的忍耐力是必须的，他必须进行一次成功的熟练检定。请注意，该熟练并不会让角色在缺乏水和食物的情况下延长剧烈运动的时间。',
  },
  {
    id: 'gaming-warrior',
    name: '游戏',
    englishName: 'Gaming',
    group: 'warrior',
    slots: 1,
    relatedAbility: 'cha',
    checkModifier: 0,
    description: '角色懂得大多数类型的常见的运气型或者技术型的游戏（见游荡者类相同熟练描述）。',
  },
  {
    id: 'hunting',
    name: '狩猎',
    englishName: 'Hunting',
    group: 'warrior',
    slots: 1,
    relatedAbility: 'wis',
    checkModifier: -1,
    description:
      '当在野外时，角色可以尝试潜随猎物并展开狩猎。每个没有本熟练且参与了捕猎的猎人都要进行一次受到-1惩罚的检定。如果检定成功，那么猎人（以及所有和他一起的人）来到某只动物的101至200码内。他们可以试着缩短距离，但每接近20码就必须进行一次熟练检定。如果潜随成功，那么猎人就可以突袭猎物。被潜随接近的动物类型取决于当地的地形和DM的心血来潮。',
  },
  {
    id: 'mountaineering',
    name: '攀登',
    englishName: 'Mountaineering',
    group: 'warrior',
    slots: 1,
    relatedAbility: 'none',
    checkModifier: 0,
    description:
      '拥有本熟练的角色能够借助攀登靴、绳索等工具爬上困难而危险的陡峭的山坡和悬崖。如果拥有攀登熟练的人领导着一支队伍，放置岩钉并指导其他人，整个队伍都可以从他的知识中获益。一个攀登者可以领导团队攀上其他人所无法爬上的峭壁表面。拥有本熟练的角色能够获得每个熟练槽10%的奖励以爬上任何表面。注意攀登和贼的攀爬能力并不相同，因为后者不需要任何类型的帮助。',
  },
  {
    id: 'navigation-warrior',
    name: '导航',
    englishName: 'Navigation',
    group: 'warrior',
    slots: 1,
    relatedAbility: 'int',
    checkModifier: -2,
    description: '角色通过星象、研究洋流、观察土地的迹象、珊瑚礁，以及隐藏的危险而学会了导航（见祭司类相同熟练描述）。',
  },
  {
    id: 'running',
    name: '奔跑',
    englishName: 'Running',
    group: 'warrior',
    slots: 1,
    relatedAbility: 'con',
    checkModifier: -6,
    description:
      '角色能够一整天都移动两倍于自己的移动力的距离。在当天结束时他必须要睡眠八个小时，在第一天的移动之后，角色必须进行一个熟练检定。成功则意味着角色第二天能够继续以奔跑的形式移动，失败则意味着不能。如果角色在奔跑一整天之后进行战斗，他在所有攻击检定上承受-1的惩罚。',
  },
  {
    id: 'set-snares-warrior',
    name: '设置陷阱',
    englishName: 'Set Snares',
    group: 'warrior',
    slots: 1,
    relatedAbility: 'dex',
    checkModifier: -1,
    description: '角色可以设置简单的陷阱来用于小规模狩猎（见游荡者类相同熟练描述）。',
  },
  {
    id: 'survival',
    name: '生存',
    englishName: 'Survival',
    group: 'warrior',
    slots: 2,
    relatedAbility: 'int',
    checkModifier: 0,
    description:
      '本熟练必须对应一种特定的环境，即特定类型的环境和天气因素。常见的环境包括极地、森林、沙漠、草原、山地或者热带。角色拥有针对该环境类型的基本生存知识。额外熟练槽能够让角色熟悉更多类型的地形。\n\n拥有生存熟练的角色对他在这种环境中所面临的危险有着基本的认知。他知道天气的影响，也知道如何减少被发现的风险的合理步骤。他知道如何找到或收集可饮用的水。他知道在哪些地方可以找到必要的，虽然不可口但可以充饥的食物。此外，拥有生存技能的角色同样也能指导帮助其他在同样境况下的人。当使用本熟练寻找食物或者水源时，角色必须进行熟练检定，失败则当天不可再对此进行更多的尝试。\n\n生存技能并不能将角色从艰苦和恐怖的野外迷途中拯救出来。它最多也不过能让角色稍微减轻一点苦难。找到的食物仅能勉强果腹，饮水聊胜于无。一个拥有生存熟练的角色仍有可能曝尸荒野。事实上，这方面的小知识可能会让不幸的角色死于自己的自负！',
  },
  {
    id: 'tracking',
    name: '追踪',
    englishName: 'Tracking',
    group: 'warrior',
    slots: 2,
    relatedAbility: 'wis',
    checkModifier: 0,
    description:
      '拥有追踪熟练的角色能够沿着痕迹跟随生物，并能使角色在大部分类型的地形上通行。非游侠的生物需要在进行熟练检定时承受-6惩罚，而游侠在这方面不受到任何惩罚。另外，同样应当根据情况应用调整值（表格39：松软的地面+4、小灌木丛+3、路上不经意留下的线索+2、普通土地0、岩石地面或浅水-10、每多两个被追踪的人+1、追踪之前每经过12小时-1、下雨下雪或雨夹雪天气每1小时-5、低光-6、被追踪者试图隐藏行踪-5）。\n\n要追踪成功，该生物必须要留下某种类型的踪迹。因此，一个飞行生物或者非实体的生物是几乎不可能被追踪的。在罕见的情况下DM可能会允许这种情况，但他也应该在尝试时受到相当程度的惩罚。\n\n要追踪一个生物，角色首先必须要发现其踪迹。在室内，追踪者必须在30分钟内看到过该生物并且在该生物最后一次被看到的地方进行追踪。在户外，追踪者必须看到过该生物，并且有目击者告诉他他所追踪的生物向哪个方向移动了，或者必须有明确的生物在该区域的证据。如果满足这些条件，则可以进行熟练检定。成功则意味着找到了线索，失败则不然。\n\n如果发现了线索，在以下情况下进行额外的熟练检定：降低追踪成功率（地形、雨、生物离开大队、黑暗等）；穿过前一个线索的另一个线索；在停止之后继续追踪（休息、进食或者战斗等）。\n\n一旦追踪者的熟练检定失败，追踪者必须进行另一次检定并至少要花一个小时来重新找到线索。如果检定再次失败，则不能再进行任何追踪尝试。如果数个追踪者在追踪一个线索，那么其中能力最强的追踪者在能力骰上获得+1。如果他跟丢了，则所有人都跟丢了。',
  },
  {
    id: 'weaponsmithing',
    name: '制造武器',
    englishName: 'Weaponsmithing',
    group: 'warrior',
    slots: 3,
    relatedAbility: 'int',
    checkModifier: -3,
    description:
      '这项高度专精的熟练使角色能够完成困难和高精度的工作，包括制造金属武器——特别是那些刀剑的。该角色融合了一些铁匠的技能，以让刀剑变得锋利而坚固。要运用这项熟练，必须要有一个准备充足的铁匠铺。\n\n制造各种类型的武器所花费的金钱和时间列在表格41中（例如：箭头10/每天/1cp，战斧10天/10sp，手斧5天/5sp，匕首5天/2sp，重弩20天/10sp，轻弩15天/5sp，叉/三叉戟20天/10sp，矛/骑枪4天/4sp，短剑20天/5sp，长剑30天/10sp，双手剑45天/2gp）。',
  },

  // ==================== 法师类 ====================
  {
    id: 'ancient-history-wizard',
    name: '古代历史',
    englishName: 'Ancient History',
    group: 'wizard',
    slots: 1,
    relatedAbility: 'int',
    checkModifier: -1,
    description: '角色知道一些古代时间和地点的传奇、传说和历史（见祭司类相同熟练描述）。',
  },
  {
    id: 'astrology-wizard',
    name: '占星术',
    englishName: 'Astrology',
    group: 'wizard',
    slots: 2,
    relatedAbility: 'int',
    checkModifier: 0,
    description: '该熟练让角色能够一定程度地理解群星产生的影响（见祭司类相同熟练描述）。',
  },
  {
    id: 'engineering-wizard',
    name: '工程学',
    englishName: 'Engineering',
    group: 'wizard',
    slots: 2,
    relatedAbility: 'int',
    checkModifier: -3,
    description: '该角色被培养成为大大小小物品的建造者（见祭司类相同熟练描述）。',
  },
  {
    id: 'gem-cutting-wizard',
    name: '宝石切割',
    englishName: 'Gem Cutting',
    group: 'wizard',
    slots: 2,
    relatedAbility: 'dex',
    checkModifier: -2,
    description: '拥有此熟练的玩家每天可以雕琢1d10颗通过挖掘而被发现的原石（见游荡者类相同熟练描述）。',
  },
  {
    id: 'herbalism-wizard',
    name: '药草学',
    englishName: 'Herbalism',
    group: 'wizard',
    slots: 2,
    relatedAbility: 'int',
    checkModifier: -2,
    description: '拥有药草学知识的角色能识别植物和真菌（见祭司类相同熟练描述）。',
  },
  {
    id: 'languages-ancient-wizard',
    name: '古代语言',
    englishName: 'Languages, Ancient',
    group: 'wizard',
    slots: 1,
    relatedAbility: 'int',
    checkModifier: 0,
    description: '角色掌握了一种艰难晦涩，如今只能够在老学究和术士的著作中见到的语言（见祭司类相同熟练描述）。',
  },
  {
    id: 'navigation-wizard',
    name: '导航',
    englishName: 'Navigation',
    group: 'wizard',
    slots: 1,
    relatedAbility: 'int',
    checkModifier: -2,
    description: '角色通过星象、研究洋流、观察土地的迹象、珊瑚礁，以及隐藏的危险而学会了导航（见祭司类相同熟练描述）。',
  },
  {
    id: 'reading-writing-wizard',
    name: '阅读/书写',
    englishName: 'Reading/Writing',
    group: 'wizard',
    slots: 1,
    relatedAbility: 'int',
    checkModifier: 1,
    description: '角色能够阅读和书写他所能说的一门当代语言（见祭司类相同熟练描述）。',
  },
  {
    id: 'religion-wizard',
    name: '宗教知识',
    englishName: 'Religion',
    group: 'wizard',
    slots: 1,
    relatedAbility: 'wis',
    checkModifier: 0,
    description: '拥有宗教知识的角色知道常见的信仰以及他的家乡和附近地区的主要宗教信仰（见祭司类相同熟练描述）。',
  },
  {
    id: 'spellcraft-wizard',
    name: '辨识法术',
    englishName: 'Spellcraft',
    group: 'wizard',
    slots: 1,
    relatedAbility: 'int',
    checkModifier: -2,
    description:
      '尽管本熟练并不会让角色施展法术，但可以让角色辨识出被施展的法术之间形式和仪式的不同（见祭司类相同熟练描述）。',
  },
];

// 工具函数

// 根据ID获取非武器熟练
export function getProficiencyById(profId: string): NonweaponProficiency | undefined {
  return NONWEAPON_PROFICIENCIES.find(p => p.id === profId);
}

// 根据分组获取非武器熟练列表
export function getProficienciesByGroup(group: ProficiencyGroup): NonweaponProficiency[] {
  return NONWEAPON_PROFICIENCIES.filter(p => p.group === group);
}

// 获取所有分组
export function getAllGroups(): ProficiencyGroup[] {
  return ['general', 'warrior', 'wizard', 'priest', 'rogue'];
}

// 获取分组的中文名称
export function getGroupName(group: ProficiencyGroup): string {
  const names: Record<ProficiencyGroup, string> = {
    general: '通用',
    warrior: '勇士',
    wizard: '法师',
    priest: '祭司',
    rogue: '游荡者',
  };
  return names[group];
}

// 计算非武器熟练的槽位成本（跨组+1）
export function getProficiencyCost(profId: string, characterGroups: ProficiencyGroup[]): number {
  const prof = getProficiencyById(profId);
  if (!prof) {
    console.warn(`无效的熟练ID: ${profId}`);
    return 1; // 默认返回1槽，而不是999
  }

  // 如果属于角色的任一组，使用基础成本
  if (characterGroups.includes(prof.group) || prof.group === 'general') {
    return prof.slots;
  }

  // 跨组需要额外+1槽位
  return prof.slots + 1;
}
