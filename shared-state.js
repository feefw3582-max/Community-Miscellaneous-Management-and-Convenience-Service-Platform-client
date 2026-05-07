(function () {
  const STATE_VERSION = 5;
  const SHARED_KEY = `changlouyun:shared-state:v${STATE_VERSION}`;
  const PAGE_KEY_PREFIX = `changlouyun:page-ui:v${STATE_VERSION}:`;

  const fallbackSharedState = {
    meta: {
      communityName: "海棠苑",
      sprintLabel: "楼道共治演示周",
      updatedAt: "今天 18:20"
    },
    incidents: [
      {
        id: "EVT-1024",
        residentId: "R-01",
        residentName: "李阿姨",
        title: "旧鞋柜与纸箱占用消防通道",
        building: "3号楼 2单元 5层",
        room: "502",
        severity: "red",
        status: "pending",
        currentStage: "等待住户确认处理路径",
        deadlineText: "24 小时内需完成首轮推进",
        summary: "旧鞋柜长期占道，纸箱堆放在弱电井旁，已影响通行宽度与消防安全。",
        source: "巡查发现",
        recommendation: "先提供 48 小时周转位，再安排助老协助与低价清运，避免直接冲突。",
        rewardSuggestion: "完成闭环后发放 30 住户积分与食用油兑换券",
        serviceNeeds: ["48 小时周转位", "助老协助", "上门清运"],
        selectedPath: "",
        consoleActions: [
          { id: "send_reminder", label: "发送温和提醒" },
          { id: "assign_storage", label: "分配周转位" },
          { id: "create_assist", label: "创建协助工单" }
        ],
        timeline: [
          "09:10 巡查员上传照片并标记红色风险",
          "09:24 系统识别为高龄住户场景，生成温和提醒草案",
          "09:35 等待住户或家属选择处理路径"
        ]
      },
      {
        id: "EVT-1025",
        residentId: "R-02",
        residentName: "王先生",
        title: "婴儿车与折叠桌临时堆放",
        building: "7号楼 1单元 3层",
        room: "301",
        severity: "yellow",
        status: "in_progress",
        currentStage: "已预约回收，等待服务商上门",
        deadlineText: "明天 10:00 上门回收",
        summary: "住户已选择上门回收，当前重点是履约提醒与进度可见。",
        source: "住户自报",
        recommendation: "保持低打扰提醒，确保回收服务商准时到场，减少重复沟通。",
        rewardSuggestion: "完成闭环后发放 20 住户积分",
        serviceNeeds: ["预约回收", "进度可见"],
        selectedPath: "recycle",
        consoleActions: [
          { id: "send_reminder", label: "发送履约提醒" },
          { id: "create_assist", label: "创建协助工单" }
        ],
        timeline: [
          "昨天 18:30 住户主动报备临时堆放",
          "昨天 18:36 系统推荐预约回收",
          "昨天 18:42 住户确认上门时间"
        ]
      },
      {
        id: "EVT-1026",
        residentId: "R-03",
        residentName: "陈女士",
        title: "装修余料短时堆放",
        building: "2号楼 3单元 6层",
        room: "601",
        severity: "blue",
        status: "completed",
        currentStage: "已闭环，等待成果沉淀",
        deadlineText: "已完成回访销项",
        summary: "物业已协助集中清运，住户确认无异议，可作为正向案例沉淀。",
        source: "邻里上报",
        recommendation: "将其沉淀为低冲突治理案例，用于楼栋成果展示与认知运营。",
        rewardSuggestion: "已核销 1 张清运优惠券",
        serviceNeeds: ["快速清运", "回访销项"],
        selectedPath: "cleanup",
        consoleActions: [{ id: "send_reminder", label: "发送感谢回访" }],
        timeline: [
          "前天 11:20 邻居拍照上报",
          "前天 13:00 管家电话确认处理方式",
          "昨天 09:00 上门清运完成",
          "昨天 16:00 住户确认闭环"
        ]
      },
      {
        id: "EVT-1027",
        residentId: "R-04",
        residentName: "周阿姨",
        title: "旧婴儿车放在楼道拐角",
        building: "6号楼 1单元 4层",
        room: "402",
        severity: "yellow",
        status: "pending",
        currentStage: "等待家属代办确认",
        deadlineText: "48 小时内完成首次沟通",
        summary: "物品体量不大但长期占位，住户本人不熟悉线上操作，需要适老代办。",
        source: "物业巡查",
        recommendation: "优先联系家属代办，再判断是否需要周转位或协助清运。",
        rewardSuggestion: "完成后发放鸡蛋兑换券",
        serviceNeeds: ["家属代办", "温和提醒"],
        selectedPath: "",
        consoleActions: [
          { id: "send_reminder", label: "同步家属提醒" },
          { id: "create_assist", label: "创建适老协助工单" }
        ],
        timeline: [
          "今天 08:20 巡查发现旧婴儿车长期占位",
          "今天 08:40 系统识别为适老场景并匹配家属代办关系"
        ]
      }
    ],
    residents: [
      {
        id: "R-01",
        name: "李阿姨",
        room: "3号楼 2单元 502",
        identity: "高龄住户",
        profile: "68 岁，退休居民，与老伴同住。",
        tags: ["高龄住户", "高复发关注", "可家属代办"],
        challenge: "舍不得扔、不熟悉线上操作，还需要搬运协助。",
        recommendedStrategy: [
          "先提供家属代办入口，减少老人自己操作压力",
          "提醒文案避免指责，先给解决路径再谈治理要求",
          "优先安排周转位和助老协助，降低第一步门槛"
        ],
        family: {
          agent: "女儿 李婷",
          status: "可代预约、可代确认完成",
          note: "系统会同步提醒给家属，由家属帮助选择路径和确认进度。",
          actions: ["可代选处理路径", "可代确认上门时段", "可代确认完成结果"]
        },
        wallet: [
          {
            id: "ledger-R01-001",
            title: "住户积分 +50",
            type: "已到账",
            note: "上月完成楼道纸箱整理",
            status: "credited",
            account: "resident",
            assetType: "points",
            amount: 50,
            createdAt: "上月"
          },
          {
            id: "ledger-R01-002",
            title: "住户积分 +30",
            type: "已到账",
            note: "家属代办完成上次楼道清理",
            status: "credited",
            account: "resident",
            assetType: "points",
            amount: 30,
            createdAt: "上月"
          },
          {
            id: "ledger-R01-003",
            title: "贡献积分 +15",
            type: "已到账",
            note: "帮助邻里确认过一次代办流程",
            status: "credited",
            account: "volunteer",
            assetType: "points",
            amount: 15,
            createdAt: "上周"
          },
          {
            id: "ledger-R01-004",
            title: "楼道共治参与者",
            type: "已解锁",
            note: "完成过一次完整的楼道治理闭环",
            status: "unlocked",
            account: "achievement",
            assetType: "badge",
            createdAt: "上月"
          },
          {
            id: "ledger-R01-005",
            title: "助老协作新手",
            type: "已解锁",
            note: "第一次参与助老协作后解锁",
            status: "unlocked",
            account: "achievement",
            assetType: "badge",
            createdAt: "上周"
          }
        ],
        points: {
          resident: 80,
          volunteer: 15,
          badges: ["楼道共治参与者", "助老协作新手"]
        },
        grantCodes: [],
        rewardSummary: "先选处理方式，再锁定本次奖励",
        history: ["上月曾出现纸箱临时堆放，后由家属代办完成处理"],
        selectedOption: "",
        latestUnlock: null
      },
      {
        id: "R-02",
        name: "王先生",
        room: "7号楼 1单元 301",
        identity: "双职工家庭",
        profile: "34 岁，双职工家庭，更重视效率与准时履约。",
        tags: ["时间敏感", "可自助办理"],
        challenge: "白天不在家，希望一次预约就能闭环，不想重复沟通。",
        recommendedStrategy: [
          "突出时间选择与到场提醒",
          "让进度时间线更透明，降低不确定感",
          "完成后自动发放电子奖励，减少额外动作"
        ],
        family: {
          agent: "无需代办",
          status: "本人可独立处理",
          note: "这类住户更看重效率、准时履约和一次处理完成。",
          actions: ["短信提醒", "到场前 2 小时提醒", "完成后自动销项"]
        },
        wallet: [
          {
            id: "ledger-R02-001",
            title: "住户积分 +35",
            type: "已到账",
            note: "上次按时完成楼道整理",
            status: "credited",
            account: "resident",
            assetType: "points",
            amount: 35,
            createdAt: "上月"
          },
          {
            id: "ledger-R02-002",
            title: "住户积分 +30",
            type: "已到账",
            note: "参与楼栋共治活动",
            status: "credited",
            account: "resident",
            assetType: "points",
            amount: 30,
            createdAt: "上月"
          },
          {
            id: "ledger-R02-003",
            title: "贡献积分 +40",
            type: "已到账",
            note: "做过两次轻任务协助",
            status: "credited",
            account: "volunteer",
            assetType: "points",
            amount: 40,
            createdAt: "上周"
          },
          {
            id: "ledger-R02-004",
            title: "本次回收闭环积分 +20",
            type: "待到账",
            note: "本次回收履约完成后自动到账",
            status: "pending",
            account: "resident",
            assetType: "points",
            amount: 20,
            createdAt: "昨天"
          },
          {
            id: "ledger-R02-005",
            title: "回收优先券",
            type: "待到账",
            note: "本次事件闭环后可领取",
            status: "pending",
            account: "benefit",
            assetType: "coupon",
            createdAt: "昨天"
          },
          {
            id: "ledger-R02-006",
            title: "轻任务参与者",
            type: "已解锁",
            note: "已连续参与多次轻任务",
            status: "unlocked",
            account: "achievement",
            assetType: "badge",
            createdAt: "上周"
          }
        ],
        points: {
          resident: 65,
          volunteer: 40,
          badges: ["轻任务参与者"]
        },
        grantCodes: [],
        rewardSummary: "本次闭环奖励已锁定，等待回收完成后到账",
        history: ["本季度首次出现楼道临时堆放问题"],
        selectedOption: "recycle",
        latestUnlock: null
      },
      {
        id: "R-03",
        name: "陈女士",
        room: "2号楼 3单元 601",
        identity: "装修过渡住户",
        profile: "41 岁，装修过渡场景，配合度高，愿意参与共治。",
        tags: ["一次性问题", "配合度高", "可参与志愿"],
        challenge: "需要快速清运，但不想被反复打扰。",
        recommendedStrategy: [
          "提供一键清运入口，减少选择成本",
          "完成后即时回访销项，强化体验闭环",
          "适合作为志愿协助者和正向案例传播对象"
        ],
        family: {
          agent: "丈夫可代办",
          status: "本次事件已闭环",
          note: "适合沉淀为治理案例，也适合成为志愿协助者。",
          actions: ["清运完成后回访", "沉淀为案例进入楼栋周报"]
        },
        wallet: [
          {
            id: "ledger-R03-001",
            title: "住户积分 +60",
            type: "已到账",
            note: "装修余料处理完成后到账",
            status: "credited",
            account: "resident",
            assetType: "points",
            amount: 60,
            createdAt: "昨天"
          },
          {
            id: "ledger-R03-002",
            title: "住户积分 +60",
            type: "已到账",
            note: "上次配合完成清运闭环",
            status: "credited",
            account: "resident",
            assetType: "points",
            amount: 60,
            createdAt: "上月"
          },
          {
            id: "ledger-R03-003",
            title: "贡献积分 +30",
            type: "已到账",
            note: "参与过一次现场协助",
            status: "credited",
            account: "volunteer",
            assetType: "points",
            amount: 30,
            createdAt: "上月"
          },
          {
            id: "ledger-R03-004",
            title: "贡献积分 +25",
            type: "已到账",
            note: "陪同完成婴儿车回收交接",
            status: "credited",
            account: "volunteer",
            assetType: "points",
            amount: 25,
            createdAt: "昨天"
          },
          {
            id: "ledger-R03-005",
            title: "清运优惠券",
            type: "已使用",
            note: "已核销 1 张",
            status: "used",
            account: "benefit",
            assetType: "coupon",
            createdAt: "昨天"
          },
          {
            id: "ledger-R03-006",
            title: "楼栋共治达人",
            type: "已解锁",
            note: "最近一次志愿协助让你成为本楼栋的共治榜样。",
            status: "unlocked",
            account: "achievement",
            assetType: "badge",
            createdAt: "昨天"
          }
        ],
        points: {
          resident: 120,
          volunteer: 55,
          badges: ["楼栋共治达人"]
        },
        grantCodes: ["task:VT-002:volunteer-points"],
        rewardSummary: "已获得清运优惠券与积分奖励",
        history: ["昨天已完成装修余料清运并完成回访"],
        selectedOption: "cleanup",
        latestUnlock: {
          type: "badge",
          title: "楼栋共治达人",
          note: "最近一次志愿协助让你成为本楼栋的共治榜样。"
        }
      },
      {
        id: "R-04",
        name: "周阿姨",
        room: "6号楼 1单元 402",
        identity: "适老场景",
        profile: "72 岁，独居住户，不熟悉智能手机操作。",
        tags: ["独居", "适老关注", "家属代办"],
        challenge: "不习惯线上办理，更依赖电话和家属确认。",
        recommendedStrategy: [
          "优先走家属代办，再判断是否需要上门协助",
          "减少打扰频次，尽量用电话和熟悉的人沟通",
          "把流程讲得更简单，降低心理压力"
        ],
        family: {
          agent: "外甥 刘博",
          status: "等待家属确认",
          note: "适老场景要把电话同步、代办确认和温和措辞放在前面。",
          actions: ["电话同步家属", "代选清理路径", "确认是否需要协助上门"]
        },
        wallet: [
          {
            id: "ledger-R04-001",
            title: "住户积分 +40",
            type: "已到账",
            note: "历史配合完成过一次公共空间整理",
            status: "credited",
            account: "resident",
            assetType: "points",
            amount: 40,
            createdAt: "上月"
          },
          {
            id: "ledger-R04-002",
            title: "贡献积分 +40",
            type: "已到账",
            note: "陪同完成过一次楼道搬运协助",
            status: "credited",
            account: "volunteer",
            assetType: "points",
            amount: 40,
            createdAt: "上月"
          },
          {
            id: "ledger-R04-003",
            title: "贡献积分 +30",
            type: "已到账",
            note: "参与过一次适老协助任务",
            status: "credited",
            account: "volunteer",
            assetType: "points",
            amount: 30,
            createdAt: "上周"
          },
          {
            id: "ledger-R04-004",
            title: "助老服务伙伴",
            type: "已解锁",
            note: "多次参与适老协助后解锁",
            status: "unlocked",
            account: "achievement",
            assetType: "badge",
            createdAt: "上周"
          }
        ],
        points: {
          resident: 40,
          volunteer: 70,
          badges: ["助老服务伙伴"]
        },
        grantCodes: [],
        rewardSummary: "等待家属确认后，再锁定适老奖励",
        history: ["暂无历史事件，本次为首次治理提醒"],
        selectedOption: "",
        latestUnlock: null
      }
    ],
    volunteerTasks: [
      {
        id: "VT-001",
        title: "帮助李阿姨确认处理路径",
        type: "轻任务",
        duration: "15 分钟",
        targetResidentId: "R-01",
        targetResidentName: "李阿姨",
        building: "3号楼 2单元",
        rewardPoints: 15,
        status: "open",
        assigneeResidentId: "",
        assigneeName: "",
        criteria: "帮助高龄住户或家属完成一次处理路径选择，并记录处理意愿。",
        note: "适合熟悉手机操作的邻里快速协助。",
        outcomeSummary: "已帮助老人顺利完成选择，减少首次处理阻力。"
      },
      {
        id: "VT-002",
        title: "陪同完成婴儿车回收交接",
        type: "协助任务",
        duration: "30 分钟",
        targetResidentId: "R-02",
        targetResidentName: "王先生",
        building: "7号楼 1单元",
        rewardPoints: 25,
        status: "claimed",
        assigneeResidentId: "R-03",
        assigneeName: "陈女士",
        criteria: "陪同服务商完成回收交接并上传前后对比记录。",
        note: "适合白天在家的热心邻里。",
        outcomeSummary: "协助履约更顺畅，减少了住户等待和物业往返沟通。"
      },
      {
        id: "VT-003",
        title: "周六楼栋共治日组织任务",
        type: "组织任务",
        duration: "60 分钟",
        targetResidentId: "",
        targetResidentName: "本楼栋公开任务",
        building: "6号楼 1单元",
        rewardPoints: 40,
        status: "draft",
        assigneeResidentId: "",
        assigneeName: "",
        criteria: "组织一次楼栋整理与成果上传，至少完成 3 户沟通。",
        note: "需要物业先发布，发布后住户端任务大厅可报名。",
        outcomeSummary: "形成一次楼栋级共治活动案例，并沉淀传播内容。"
      }
    ],
    pointsRules: {
      resident: [
        "主动报备并选择处理路径：+15",
        "预约回收或清运并完成：+20",
        "配合使用周转位并按时清空：+15",
        "参与楼栋共治活动：+30"
      ],
      volunteer: [
        "帮助老人完成一次代办：+15",
        "参与一次现场协助：+25",
        "完成一次搬运协助：+30",
        "组织一次楼栋共治日：+40"
      ]
    },
    buildingResults: [
      {
        id: "BR-001",
        title: "3号楼消防通道恢复通行",
        summary: "通过周转位与家属代办组合，把高阻力事件拆成了住户愿意接受的几步。",
        metric: "通行宽度恢复 100%",
        owner: "共治运营中心",
        updatedAt: "今天 17:20",
        tags: ["红色风险闭环", "助老场景", "周转位策略"]
      },
      {
        id: "BR-002",
        title: "7号楼形成邻里协助样板",
        summary: "回收交接由邻里志愿者陪同，物业角色从被动催办变成资源调度。",
        metric: "履约等待时长下降 40%",
        owner: "楼栋志愿者",
        updatedAt: "今天 16:40",
        tags: ["协助任务", "回收履约", "认知改变"]
      },
      {
        id: "BR-003",
        title: "6号楼共治日进入预热",
        summary: "运营中心已沉淀组织任务和传播文案，等待正式发布后招募报名。",
        metric: "预热志愿者 2 人",
        owner: "物业管家",
        updatedAt: "今天 15:10",
        tags: ["组织任务", "楼栋运营", "志愿池"]
      }
    ],
    cognitionCards: [
      {
        title: "提醒文案从命令式改为协助式",
        body: "不再强调“立即清理”，而是先解释为什么会影响邻里通行与消防安全，再给住户可执行的路径。",
        metric: "提醒后首次响应率 72%",
        owner: "通知策略中心"
      },
      {
        title: "成果展示用 Before / After 代替训诫",
        body: "每次闭环都同步楼栋前后对比和感谢文案，把认知改变落在看得见的公共空间改善上。",
        metric: "楼栋正向反馈 18 条",
        owner: "共治运营中心"
      },
      {
        title: "双积分被定义为社区贡献账本",
        body: "住户积分强调主动配合，贡献积分强调帮助他人，让物业从清理执行转向运营组织。",
        metric: "志愿报名意愿提升 26%",
        owner: "激励中心"
      }
    ],
    storageSlots: [
      {
        name: "A-01",
        area: "西侧周转区",
        status: "occupied",
        residentId: "R-02",
        residentLabel: "王先生",
        deadlineText: "等待回收上门"
      },
      {
        name: "A-02",
        area: "西侧周转区",
        status: "available",
        residentId: "",
        residentLabel: "空位",
        deadlineText: "可立即分配"
      },
      {
        name: "B-01",
        area: "东侧周转区",
        status: "available",
        residentId: "",
        residentLabel: "空位",
        deadlineText: "可立即分配"
      },
      {
        name: "B-02",
        area: "东侧周转区",
        status: "maintenance",
        residentId: "",
        residentLabel: "整理中",
        deadlineText: "今天 18:00 恢复"
      }
    ],
    rewards: [
      {
        title: "适老实物奖励",
        note: "针对高龄住户优先发放食用油、鸡蛋等更有感知的奖励。",
        stat: "本周发放 26 份",
        impact: "高龄住户首次响应率提升 31%"
      },
      {
        title: "楼栋共治积分",
        note: "按楼栋累计贡献，可兑换便民服务日或公共空间升级权益。",
        stat: "7 栋参与中",
        impact: "高频投诉楼栋减少 2 栋"
      },
      {
        title: "清运与回收优惠券",
        note: "用于引导低价值大件杂物更快进入清运或回收路径。",
        stat: "核销率 68%",
        impact: "中青年住户预约转化更高"
      }
    ]
  };

  const fallbackConsoleData = {
    buildings: [
      {
        name: "3号楼 2单元",
        score: 82,
        focus: "高龄住户集中",
        note: "优先投放周转位、助老协助与家属代办资源。"
      },
      {
        name: "7号楼 1单元",
        score: 61,
        focus: "履约效率优先",
        note: "中青年家庭多，关键是预约时间透明和服务商准时。"
      },
      {
        name: "6号楼 1单元",
        score: 49,
        focus: "适老运营预热",
        note: "适合先做家属代办和共治日预热，再逐步提升参与度。"
      }
    ],
    insights: [
      "最难的不是发现问题，而是让住户看到一条自己愿意迈出去的处理路径。",
      "高龄住户有效策略不是强清，而是代办、周转位和上门协助。",
      "低价值杂物场景里，奖励和协助比单纯通知更能推动闭环。"
    ],
    outcomes: [
      {
        title: "治理从一次清理升级为持续运营",
        note: "课程展示里要讲清楚，系统价值不只是处理事件，而是形成可复用的运营闭环。"
      },
      {
        title: "双端状态联动是核心演示点",
        note: "中台和客户端页面独立打开，但用共享状态展示同一个业务世界。"
      }
    ],
    rewardReview: [
      "适老住户对实物激励感知更强，适合作为首轮动员工具。",
      "中青年住户更看重效率型权益，比如预约优先和即时积分到账。",
      "楼栋级积分更适合做正向运营，不适合做羞辱式公示。"
    ],
    governanceInsights: [
      "志愿任务必须任务化，而不是抽象写成“欢迎参与志愿服务”。",
      "住户积分与贡献积分必须分账展示，避免把配合行为和助人行为混成一类。",
      "物业的角色不是单纯清理执行，而是资源编排、激励设计和成果运营。"
    ],
    governancePlaybook: [
      {
        title: "发布轻任务",
        note: "把“陪聊、代点、确认路径”这样的低门槛动作拆成能被报名的小任务。"
      },
      {
        title: "展示成果卡",
        note: "每次完成志愿协助后都生成成果卡，回流到客户端和中台周报。"
      },
      {
        title: "经营认知内容",
        note: "把楼道整洁、邻里互助和公共安全放到一套正向叙事里持续强化。"
      }
    ],
    operationModules: [
      {
        kicker: "巡查任务",
        title: "巡查任务中心",
        note: "展示巡查频次、路线、打卡完成率和异常上报入口。"
      },
      {
        kicker: "服务商协同",
        title: "服务商协同台",
        note: "展示回收商、清运商和助老协助人员的接单与履约状态。"
      },
      {
        kicker: "通知策略",
        title: "通知策略中心",
        note: "展示短信、微信、电话提醒节奏和不同人群的提醒模板。"
      },
      {
        kicker: "规则配置",
        title: "规则配置中心",
        note: "展示风险分级、超时规则、奖励规则和楼栋阈值配置。"
      },
      {
        kicker: "报表中心",
        title: "报表与导出页",
        note: "展示周报、月报、整改报告和街道汇报材料的导出入口。"
      },
      {
        kicker: "专项运营",
        title: "专项整治运营页",
        note: "展示集中整治、文明创建、消防检查等专题运营视图。"
      }
    ]
  };

  const fallbackResidentData = {
    help: [
      {
        title: "为什么不是直接清掉？",
        note: "这个原型强调先给路径、再做治理，避免简单粗暴处理带来的反弹。"
      },
      {
        title: "不会用手机怎么办？",
        note: "可以由家属代办，也可以由物业电话确认后代录结果。"
      },
      {
        title: "为什么会有周转位？",
        note: "周转位是缓冲机制，给住户一个更容易做决定的过渡空间。"
      }
    ]
  };

  function clone(data) {
    return JSON.parse(JSON.stringify(data));
  }

  function loadJsonWithFallback(path, fallback) {
    return fetch(path)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load ${path}`);
        }
        return response.json();
      })
      .catch(() => clone(fallback));
  }

  function loadSharedSeed() {
    return loadJsonWithFallback("./mock/shared-state.json", fallbackSharedState);
  }

  function loadConsolePageData() {
    return loadJsonWithFallback("./mock/console-data.json", fallbackConsoleData);
  }

  function loadResidentPageData() {
    return loadJsonWithFallback("./mock/resident-data.json", fallbackResidentData);
  }

  function createPageStore(pageName, defaults) {
    const key = `${PAGE_KEY_PREFIX}${pageName}`;
    return {
      get() {
        const raw = localStorage.getItem(key);
        if (!raw) {
          return clone(defaults);
        }
        try {
          return { ...clone(defaults), ...JSON.parse(raw) };
        } catch (_error) {
          return clone(defaults);
        }
      },
      set(patch) {
        const next = { ...this.get(), ...patch };
        localStorage.setItem(key, JSON.stringify(next));
      },
      reset() {
        localStorage.setItem(key, JSON.stringify(clone(defaults)));
      }
    };
  }

  function normalizeState(parsed) {
    const base = clone(fallbackSharedState);
    return {
      ...base,
      ...parsed,
      meta: { ...base.meta, ...(parsed.meta || {}) },
      incidents: parsed.incidents || base.incidents,
      residents: parsed.residents || base.residents,
      volunteerTasks: parsed.volunteerTasks || base.volunteerTasks,
      pointsRules: { ...base.pointsRules, ...(parsed.pointsRules || {}) },
      buildingResults: parsed.buildingResults || base.buildingResults,
      cognitionCards: parsed.cognitionCards || base.cognitionCards,
      storageSlots: parsed.storageSlots || base.storageSlots,
      rewards: parsed.rewards || base.rewards
    };
  }

  function getSharedState() {
    const raw = localStorage.getItem(SHARED_KEY);
    if (!raw) {
      return clone(fallbackSharedState);
    }

    try {
      const parsed = JSON.parse(raw);
      if (parsed.__schemaVersion !== STATE_VERSION) {
        return clone(fallbackSharedState);
      }
      delete parsed.__schemaVersion;
      return normalizeState(parsed);
    } catch (_error) {
      return clone(fallbackSharedState);
    }
  }

  function setSharedState(nextState) {
    localStorage.setItem(
      SHARED_KEY,
      JSON.stringify({ ...normalizeState(nextState), __schemaVersion: STATE_VERSION })
    );
  }

  async function ensureSharedState() {
    const raw = localStorage.getItem(SHARED_KEY);
    if (!raw) {
      const seed = await loadSharedSeed();
      setSharedState(seed);
      return normalizeState(seed);
    }

    const current = getSharedState();
    setSharedState(current);
    return current;
  }

  function resetSharedState() {
    setSharedState(clone(fallbackSharedState));
  }

  function getResidentOptions(residentId) {
    if (residentId === "R-01") {
      return [
        {
          id: "storage",
          title: "申请周转位",
          tag: "48 小时缓冲",
          note: "先把楼道里的大件转移到周转区，给家里留下处理时间。",
          actionLabel: "申请周转位"
        },
        {
          id: "cleanup",
          title: "预约清运",
          tag: "助老优先",
          note: "安排物业或服务商上门搬运，适合老人不便处理的大件杂物。",
          actionLabel: "预约清运"
        },
        {
          id: "recycle",
          title: "预约回收",
          tag: "减少浪费",
          note: "先回收纸箱和可利用物，再处理剩余部分。",
          actionLabel: "预约回收"
        },
        {
          id: "self_clear",
          title: "自行处理",
          tag: "晚间回访",
          note: "今天自行整理，系统晚间自动回访确认。",
          actionLabel: "登记自行处理"
        }
      ];
    }

    if (residentId === "R-02") {
      return [
        {
          id: "recycle",
          title: "预约回收",
          tag: "最快完成",
          note: "适合婴儿车和折叠桌，支持指定上门时段。",
          actionLabel: "确认回收预约"
        },
        {
          id: "storage",
          title: "申请周转位",
          tag: "先缓一下",
          note: "如果今晚没空处理，可以先转移到周转区。",
          actionLabel: "申请周转位"
        },
        {
          id: "cleanup",
          title: "预约清运",
          tag: "省时间",
          note: "不在意回收收益时，可以直接安排清运。",
          actionLabel: "预约清运"
        },
        {
          id: "self_clear",
          title: "自行处理",
          tag: "少打扰",
          note: "系统只保留一次回访提醒。",
          actionLabel: "登记自行处理"
        }
      ];
    }

    return [
      {
        id: "cleanup",
        title: "预约清运",
        tag: "快捷完成",
        note: "适合装修余料或临时堆物快速收尾。",
        actionLabel: "预约清运"
      },
      {
        id: "recycle",
        title: "预约回收",
        tag: "降低成本",
        note: "优先处理有回收价值的物品，降低整体清运成本。",
        actionLabel: "预约回收"
      },
      {
        id: "storage",
        title: "申请周转位",
        tag: "短时缓冲",
        note: "短时间内无法处理时，可先使用周转位。",
        actionLabel: "申请周转位"
      },
      {
        id: "self_clear",
        title: "自行处理",
        tag: "当晚回访",
        note: "系统会在晚间确认是否已处理完成。",
        actionLabel: "登记自行处理"
      }
    ];
  }

  function getLevelSnapshot(resident) {
    const total = resident.points.resident + resident.points.volunteer;
    const levels = [
      { title: "共治参与者", threshold: 0 },
      { title: "楼道协作者", threshold: 120 },
      { title: "楼栋骨干", threshold: 220 },
      { title: "社区合伙人", threshold: 340 }
    ];

    let current = levels[0];
    let next = null;
    levels.forEach((level, index) => {
      if (total >= level.threshold) {
        current = level;
        next = levels[index + 1] || null;
      }
    });

    const lowerBound = current.threshold;
    const upperBound = next ? next.threshold : current.threshold + 120;
    const progress = Math.max(0, Math.min(100, ((total - lowerBound) / (upperBound - lowerBound)) * 100));

    return {
      total,
      title: current.title,
      nextTitle: next ? next.title : "已达最高等级",
      pointsToNext: next ? Math.max(0, next.threshold - total) : 0,
      progressPercent: Number(progress.toFixed(1))
    };
  }

  function getResidentAccountState(resident) {
    const ledger = (resident.wallet || []).map((entry) => ({
      status: "credited",
      account: "benefit",
      assetType: "reward",
      ...entry
    }));
    const groups = {
      credited: [],
      pending: [],
      used: [],
      unlocked: []
    };

    ledger.forEach((entry) => {
      if (!groups[entry.status]) {
        groups[entry.status] = [];
      }
      groups[entry.status].push(entry);
    });

    const sumAmount = (entries, account) =>
      entries
        .filter((entry) => entry.account === account && typeof entry.amount === "number")
        .reduce((sum, entry) => sum + entry.amount, 0);

    return {
      ledger,
      creditedEntries: groups.credited,
      pendingEntries: groups.pending,
      usedEntries: groups.used,
      unlockedEntries: groups.unlocked,
      recentCredits: groups.credited.slice(0, 3),
      resident: {
        available: sumAmount(groups.credited, "resident"),
        pending: sumAmount(groups.pending, "resident")
      },
      volunteer: {
        available: sumAmount(groups.credited, "volunteer"),
        pending: sumAmount(groups.pending, "volunteer")
      },
      availableBenefits: groups.credited.filter((entry) => entry.account === "benefit"),
      usedBenefits: groups.used.filter((entry) => entry.account === "benefit"),
      unlockedBadges: groups.unlocked.filter((entry) => entry.assetType === "badge"),
      unlockedLevels: groups.unlocked.filter((entry) => entry.assetType === "level")
    };
  }

  function removeLedgerEntriesByPrefix(resident, prefix) {
    resident.wallet = (resident.wallet || []).filter((entry) => !entry.id.startsWith(prefix));
  }

  function upsertLedgerEntry(resident, entry) {
    const ledger = resident.wallet || (resident.wallet = []);
    const index = ledger.findIndex((item) => item.id === entry.id);
    if (index >= 0) {
      ledger[index] = { ...ledger[index], ...entry };
      return ledger[index];
    }
    ledger.unshift(entry);
    return entry;
  }

  function applyResidentOption(residentId, optionId) {
    const next = getSharedState();
    const resident = next.residents.find((item) => item.id === residentId);
    const incident = next.incidents.find((item) => item.residentId === residentId);

    if (!resident || !incident) {
      return next;
    }

    resident.selectedOption = optionId;
    incident.selectedPath = optionId;

    const actionMap = {
      storage: {
        status: "in_progress",
        stage: "已申请周转位，等待物业确认",
        deadline: "48 小时周转期内完成处理",
        timeline: "刚刚 住户申请了 48 小时周转位，等待物业确认与上门协助",
        history: "选择了“申请周转位”路径",
        rewardSummary: "本次闭环奖励已锁定，等待周转位清空后发放",
        ledgerEntries: [
          {
            id: `incident:${incident.id}:pending:resident-points`,
            title: "本次周转位闭环积分 +30",
            type: "待到账",
            note: "按时清空周转位后自动到账",
            status: "pending",
            account: "resident",
            assetType: "points",
            amount: 30,
            createdAt: "刚刚"
          },
          {
            id: `incident:${incident.id}:pending:benefit`,
            title: "食用油兑换券",
            type: "待到账",
            note: "本次事件闭环后可领取 1 份",
            status: "pending",
            account: "benefit",
            assetType: "coupon",
            createdAt: "刚刚"
          }
        ]
      },
      recycle: {
        status: "in_progress",
        stage: "已预约回收，等待服务商上门",
        deadline: "已预约最近可用上门时段",
        timeline: "刚刚 住户已预约回收，系统同步生成回收工单",
        history: "选择了“预约回收”路径",
        rewardSummary: "本次闭环奖励已锁定，等待回收完成后到账",
        ledgerEntries: [
          {
            id: `incident:${incident.id}:pending:resident-points`,
            title: "本次回收闭环积分 +20",
            type: "待到账",
            note: "本次回收履约完成后自动到账",
            status: "pending",
            account: "resident",
            assetType: "points",
            amount: 20,
            createdAt: "刚刚"
          },
          {
            id: `incident:${incident.id}:pending:benefit`,
            title: "回收优先券",
            type: "待到账",
            note: "本次事件闭环后可领取",
            status: "pending",
            account: "benefit",
            assetType: "coupon",
            createdAt: "刚刚"
          }
        ]
      },
      cleanup: {
        status: "in_progress",
        stage: "已预约清运，等待物业或服务商处理",
        deadline: "等待清运人员确认时段",
        timeline: "刚刚 住户已预约清运，等待物业或服务商接单",
        history: "选择了“预约清运”路径",
        rewardSummary: "本次闭环奖励已锁定，等待清运完成后到账",
        ledgerEntries: [
          {
            id: `incident:${incident.id}:pending:resident-points`,
            title: "本次清运闭环积分 +20",
            type: "待到账",
            note: "本次清运闭环后自动到账",
            status: "pending",
            account: "resident",
            assetType: "points",
            amount: 20,
            createdAt: "刚刚"
          },
          {
            id: `incident:${incident.id}:pending:benefit`,
            title: "清运优惠券",
            type: "待到账",
            note: "本次事件闭环后可发放",
            status: "pending",
            account: "benefit",
            assetType: "coupon",
            createdAt: "刚刚"
          }
        ]
      },
      self_clear: {
        status: "pending",
        stage: "已登记今晚自行处理",
        deadline: "今晚 20:00 自动回访",
        timeline: "刚刚 住户登记为今晚自行处理，系统将自动回访确认",
        history: "选择了“自行处理”路径",
        rewardSummary: "回访确认完成后，本次奖励会自动到账",
        ledgerEntries: [
          {
            id: `incident:${incident.id}:pending:resident-points`,
            title: "自行处理积分 +15",
            type: "待到账",
            note: "晚间回访确认完成后自动到账",
            status: "pending",
            account: "resident",
            assetType: "points",
            amount: 15,
            createdAt: "刚刚"
          }
        ]
      }
    };

    const selectedAction = actionMap[optionId];
    if (!selectedAction) {
      return next;
    }

    incident.status = selectedAction.status;
    incident.currentStage = selectedAction.stage;
    incident.deadlineText = selectedAction.deadline;
    pushTimeline(incident, selectedAction.timeline);
    prependHistory(resident, `刚刚 ${selectedAction.history}`);
    resident.rewardSummary = selectedAction.rewardSummary;
    removeLedgerEntriesByPrefix(resident, `incident:${incident.id}:pending:`);
    selectedAction.ledgerEntries.forEach((entry) => upsertLedgerEntry(resident, entry));

    if (optionId === "storage") {
      allocateStorageSlot(next, residentId, resident.name, "48 小时周转期内完成处理");
    } else {
      releaseStorageSlot(next, residentId);
    }

    if (optionId === "storage") {
      upsertBuildingResult(next, {
        id: "BR-STORAGE-DEMO",
        title: "周转位策略被居民接受",
        summary: "住户先愿意挪走占道物，再慢慢处理，系统把高阻力事件拆成了低阻力动作。",
        metric: "周转位利用率 +1",
        owner: "共治运营中心",
        updatedAt: "刚刚",
        tags: ["周转位", "路径接受", "温和治理"]
      });
    }

    next.meta.updatedAt = "刚刚";
    return next;
  }

  function applyConsoleAction(incidentId, actionId) {
    const next = getSharedState();
    const incident = next.incidents.find((item) => item.id === incidentId);

    if (!incident) {
      return next;
    }

    const resident = next.residents.find((item) => item.id === incident.residentId);

    if (actionId === "send_reminder") {
      if (incident.status !== "completed") {
        incident.status = "in_progress";
        incident.currentStage = "物业已发送温和提醒";
      }
      pushTimeline(incident, "刚刚 物业再次发送温和提醒，并附上可选处理路径");
      if (resident) {
        prependHistory(resident, "刚刚 收到物业的温和提醒与处理建议");
      }
    }

    if (actionId === "assign_storage") {
      incident.status = "in_progress";
      incident.currentStage = "物业已预留周转位";
      incident.deadlineText = "48 小时周转期内完成处理";
      pushTimeline(incident, "刚刚 物业已分配周转位，等待住户确认是否需要上门协助");
      allocateStorageSlot(next, incident.residentId, incident.residentName, "48 小时周转期内完成处理");
      if (resident) {
        resident.selectedOption = "storage";
        resident.rewardSummary = "本次闭环奖励已锁定，等待周转位清空后发放";
        removeLedgerEntriesByPrefix(resident, `incident:${incident.id}:pending:`);
        upsertLedgerEntry(resident, {
          id: `incident:${incident.id}:pending:resident-points`,
          title: "本次周转位闭环积分 +30",
          type: "待到账",
          note: "按时清空周转位后自动到账",
          status: "pending",
          account: "resident",
          assetType: "points",
          amount: 30,
          createdAt: "刚刚"
        });
        upsertLedgerEntry(resident, {
          id: `incident:${incident.id}:pending:benefit`,
          title: "食用油兑换券",
          type: "待到账",
          note: "本次事件闭环后可领取 1 份",
          status: "pending",
          account: "benefit",
          assetType: "coupon",
          createdAt: "刚刚"
        });
        prependHistory(resident, "刚刚 物业为你预留了周转位");
      }
    }

    if (actionId === "create_assist") {
      incident.status = "in_progress";
      incident.currentStage = "已创建协助工单";
      incident.deadlineText = "预计今天 16:00 上门";
      pushTimeline(incident, "刚刚 物业已创建协助工单，准备安排志愿者或服务商协同上门");
      if (resident) {
        prependHistory(resident, "刚刚 物业正在为你安排协助处理");
      }
      ensureAssistTask(next, incident, resident);
    }

    next.meta.updatedAt = "刚刚";
    return next;
  }

  function applyVolunteerTaskAction(taskId, actionId, actorResidentId) {
    const next = getSharedState();
    const task = next.volunteerTasks.find((item) => item.id === taskId);

    if (!task) {
      return next;
    }

    if (actionId === "publish" && task.status === "draft") {
      task.status = "open";
      task.note = "任务已发布，客户端任务大厅可直接报名。";
      next.cognitionCards.unshift({
        title: "楼栋共治日进入公开招募",
        body: "组织任务发布后，住户端能直接看到任务目标、积分和完成标准，报名门槛更清楚。",
        metric: "新增公开任务 1 个",
        owner: "共治运营中心"
      });
      next.meta.updatedAt = "刚刚";
      return next;
    }

    if (actionId === "signup" && task.status === "open" && actorResidentId) {
      const resident = next.residents.find((item) => item.id === actorResidentId);
      if (!resident) {
        return next;
      }
      if (task.targetResidentId && task.targetResidentId === resident.id) {
        return next;
      }

      task.status = "claimed";
      task.assigneeResidentId = resident.id;
      task.assigneeName = resident.name;
      task.note = `${resident.name} 已报名，等待中台确认执行完成。`;
      upsertLedgerEntry(resident, {
        id: `ledger:task:${task.id}:volunteer-points`,
        title: `${task.title} +${task.rewardPoints} 贡献积分`,
        type: "待到账",
        note: "等待中台确认任务完成后到账",
        status: "pending",
        account: "volunteer",
        assetType: "points",
        amount: task.rewardPoints,
        createdAt: "刚刚"
      });
      prependHistory(resident, `刚刚 报名了志愿任务《${task.title}》`);

      const targetIncident = next.incidents.find((item) => item.residentId === task.targetResidentId);
      if (targetIncident) {
        pushTimeline(targetIncident, `刚刚 志愿者 ${resident.name} 已报名协助任务`);
      }

      next.meta.updatedAt = "刚刚";
      return next;
    }

    if (actionId === "complete" && task.status === "claimed") {
      task.status = "completed";
      task.note = "任务已完成，成果卡与贡献积分已同步发放。";

      const resident = next.residents.find((item) => item.id === task.assigneeResidentId);
      if (resident) {
        const beforeLevel = getLevelSnapshot(resident).title;
        awardVolunteerPoints(
          resident,
          task.rewardPoints,
          `完成志愿任务《${task.title}》`,
          `task:${task.id}:volunteer-points`
        );
        unlockBadge(resident, "邻里志愿贡献者", "你完成了一次对他人有直接帮助的协助任务。");
        maybeUnlockLevel(resident, beforeLevel);
        prependHistory(resident, `刚刚 完成了志愿任务《${task.title}》`);
      }

      if (task.targetResidentId) {
        const incident = next.incidents.find((item) => item.residentId === task.targetResidentId);
        if (incident) {
          pushTimeline(incident, `刚刚 志愿协助完成，等待物业回访销项`);
          if (incident.status !== "completed") {
            incident.currentStage = "志愿协助已完成，等待物业回访";
          }
        }
      }

      upsertBuildingResult(next, {
        id: `result-${task.id}`,
        title: `${task.building} 新增志愿成果`,
        summary: `${task.assigneeName} 完成《${task.title}》，把协助行为沉淀成可传播的共治成果。`,
        metric: `+${task.rewardPoints} 贡献积分到账`,
        owner: "楼栋志愿者",
        updatedAt: "刚刚",
        tags: [task.type, "志愿完成", "成果沉淀"]
      });

      next.cognitionCards.unshift({
        title: "志愿完成会回流成成果展示",
        body: `任务《${task.title}》已完成，客户端和中台同步展示成果卡，强化“帮助别人也会被看见”的认知。`,
        metric: "新增成果卡 1 张",
        owner: "共治运营中心"
      });

      next.meta.updatedAt = "刚刚";
      return next;
    }

    return next;
  }

  function ensureAssistTask(state, incident, resident) {
    const hasOpenTask = state.volunteerTasks.some(
      (task) =>
        task.targetResidentId === incident.residentId &&
        (task.status === "open" || task.status === "claimed")
    );

    if (hasOpenTask) {
      return;
    }

    const nextId = `VT-${String(state.volunteerTasks.length + 1).padStart(3, "0")}`;
    state.volunteerTasks.unshift({
      id: nextId,
      title: `协助${incident.residentName}完成楼道清理`,
      type: "协助任务",
      duration: "30 分钟",
      targetResidentId: incident.residentId,
      targetResidentName: incident.residentName,
      building: incident.building.split(" ")[0],
      rewardPoints: 25,
      status: "open",
      assigneeResidentId: "",
      assigneeName: "",
      criteria: "帮助目标住户完成路径确认、物品搬运或现场交接，并补充前后记录。",
      note: `由物业发起，针对 ${resident ? resident.identity : "当前住户"} 的协助任务。`,
      outcomeSummary: "协助完成后将生成楼栋成果卡。"
    });
  }

  function allocateStorageSlot(state, residentId, residentName, deadlineText) {
    const existing = state.storageSlots.find(
      (slot) => slot.status === "occupied" && slot.residentId === residentId
    );

    if (existing) {
      existing.deadlineText = deadlineText;
      existing.residentLabel = residentName;
      return existing;
    }

    const available = state.storageSlots.find((slot) => slot.status === "available");
    if (!available) {
      return null;
    }

    available.status = "occupied";
    available.residentId = residentId;
    available.residentLabel = residentName;
    available.deadlineText = deadlineText;
    return available;
  }

  function releaseStorageSlot(state, residentId) {
    const existing = state.storageSlots.find(
      (slot) => slot.status === "occupied" && slot.residentId === residentId
    );

    if (!existing) {
      return;
    }

    existing.status = "available";
    existing.residentId = "";
    existing.residentLabel = "空位";
    existing.deadlineText = "可立即分配";
  }

  function pushTimeline(incident, message) {
    if (incident.timeline[incident.timeline.length - 1] !== message) {
      incident.timeline.push(message);
    }
  }

  function prependHistory(resident, message) {
    if (resident.history[0] !== message) {
      resident.history.unshift(message);
    }
  }

  function awardResidentPoints(resident, amount, reason, code) {
    if (resident.grantCodes.includes(code)) {
      return;
    }

    resident.grantCodes.push(code);
    resident.points.resident += amount;
    upsertLedgerEntry(resident, {
      id: `ledger:${code}`,
      title: `住户积分 +${amount}`,
      type: "已到账",
      note: reason,
      status: "credited",
      account: "resident",
      assetType: "points",
      amount,
      createdAt: "刚刚"
    });
  }

  function awardVolunteerPoints(resident, amount, reason, code) {
    if (resident.grantCodes.includes(code)) {
      return;
    }

    resident.grantCodes.push(code);
    resident.points.volunteer += amount;
    upsertLedgerEntry(resident, {
      id: `ledger:${code}`,
      title: `贡献积分 +${amount}`,
      type: "已到账",
      note: reason,
      status: "credited",
      account: "volunteer",
      assetType: "points",
      amount,
      createdAt: "刚刚"
    });
  }

  function unlockBadge(resident, badgeTitle, note) {
    if (resident.points.badges.includes(badgeTitle)) {
      return;
    }

    resident.points.badges.push(badgeTitle);
    upsertLedgerEntry(resident, {
      id: `ledger:badge:${badgeTitle}`,
      title: badgeTitle,
      type: "已解锁",
      note,
      status: "unlocked",
      account: "achievement",
      assetType: "badge",
      createdAt: "刚刚"
    });
    resident.latestUnlock = {
      type: "badge",
      title: badgeTitle,
      note
    };
  }

  function maybeUnlockLevel(resident, beforeLevelTitle) {
    const snapshot = getLevelSnapshot(resident);
    if (snapshot.title !== beforeLevelTitle) {
      upsertLedgerEntry(resident, {
        id: `ledger:level:${snapshot.title}`,
        title: snapshot.title,
        type: "已解锁",
        note: `你的总贡献达到 ${snapshot.total} 分，已升级到新的共治等级。`,
        status: "unlocked",
        account: "achievement",
        assetType: "level",
        createdAt: "刚刚"
      });
      resident.latestUnlock = {
        type: "level",
        title: snapshot.title,
        note: `你的总贡献达到 ${snapshot.total} 分，已升级到新的共治等级。`
      };
    }
  }

  function upsertBuildingResult(state, result) {
    const existing = state.buildingResults.find((item) => item.id === result.id);
    if (existing) {
      Object.assign(existing, result);
      return;
    }
    state.buildingResults.unshift(result);
  }

  function getStatusText(status) {
    if (status === "pending") {
      return "待处理";
    }
    if (status === "in_progress") {
      return "处理中";
    }
    return "已闭环";
  }

  function renderSeverityPill(severity) {
    if (severity === "red") {
      return '<span class="pill pill-red">红色风险</span>';
    }
    if (severity === "yellow") {
      return '<span class="pill pill-yellow">黄色风险</span>';
    }
    return '<span class="pill pill-blue">蓝色风险</span>';
  }

  function renderStatusTag(status) {
    if (status === "pending") {
      return '<span class="tag">待处理</span>';
    }
    if (status === "in_progress") {
      return '<span class="tag">处理中</span>';
    }
    return '<span class="tag">已闭环</span>';
  }

  window.ChangLouStore = {
    SHARED_KEY,
    ensureSharedState,
    getSharedState,
    setSharedState,
    resetSharedState,
    createPageStore,
    loadConsolePageData,
    loadResidentPageData,
    getResidentOptions,
    getResidentAccountState,
    getLevelSnapshot,
    applyResidentOption,
    applyConsoleAction,
    applyVolunteerTaskAction,
    getStatusText,
    renderSeverityPill,
    renderStatusTag
  };

  ensureSharedState();
})();
