(function () {
  if (!window.ChangLouStore) {
    return;
  }

  const HOME_SERVICES = [
    { id: "report_issue", title: "反馈问题", note: "举报其他住户或反馈楼道问题" },
    { id: "book_cleanup", title: "预约清理", note: "先说情况，系统帮你推荐更省心的路径" },
    { id: "book_transport", title: "预约清运", note: "需要上门搬运和快速清空" },
    { id: "book_recycle", title: "预约回收", note: "可回收物较多，按时段上门交接" },
    { id: "view_progress", title: "查看进度", note: "从消息进入完整处理链路" },
    { id: "view_rewards", title: "奖励权益", note: "查看到账、待到账和可用权益" }
  ];

  const HOME_PREFERENCES = [
    { id: "easy", label: "希望省心", note: "更看重有人承接，少来回沟通。" },
    { id: "fast", label: "尽快解决", note: "更在意尽快恢复楼道通行和整洁。" },
    { id: "save", label: "想要省钱", note: "优先考虑低成本和可回收处理方式。" },
    { id: "time", label: "时间充裕", note: "可以自己安排节奏，接受分步处理。" }
  ];

  const MESSAGE_FILTERS = [
    { id: "all", label: "全部" },
    { id: "processing", label: "办理提醒" },
    { id: "account", label: "账户动态" },
    { id: "community", label: "邻里动态" }
  ];

  const state = {
    messageDetailId: "",
    homePreferenceByResident: {}
  };

  const elements = {
    header: document.querySelector(".resident-app-header"),
    title: document.querySelector(".resident-app-title h1"),
    titleNote: document.getElementById("resident-title-note"),
    switcher: document.getElementById("resident-switcher"),
    statusCard: document.getElementById("status-card"),
    currentEvent: document.getElementById("resident-current-event"),
    recommended: document.getElementById("resident-recommended-option"),
    options: document.getElementById("resident-options"),
    decisions: document.getElementById("resident-home-decisions"),
    progress: document.getElementById("resident-progress"),
    reward: document.getElementById("resident-home-reward"),
    messages: document.getElementById("resident-messages"),
    messageDetail: document.getElementById("resident-message-detail"),
    messageFilters: document.getElementById("resident-message-filters"),
    fab: document.getElementById("resident-fab")
  };

  let renderTimer = null;

  bind();
  queueRender();

  function bind() {
    window.addEventListener("storage", function (event) {
      if (event.key === window.ChangLouStore.SHARED_KEY) {
        queueRender();
      }
    });

    if (elements.switcher) {
      elements.switcher.addEventListener("change", function () {
        state.messageDetailId = "";
        queueRender();
      });
    }

    document.body.addEventListener(
      "click",
      function (event) {
        const fab = event.target.closest("#resident-fab");
        if (fab && fab.dataset.refreshMode === "detail") {
          event.preventDefault();
          event.stopPropagation();
          openMessageDetail("incident");
          return;
        }

        const openDetail = event.target.closest("[data-open-message-detail]");
        if (openDetail) {
          event.preventDefault();
          event.stopPropagation();
          openMessageDetail(openDetail.dataset.openMessageDetail || "incident");
          return;
        }

        const closeDetail = event.target.closest("[data-close-message-detail]");
        if (closeDetail) {
          event.preventDefault();
          event.stopPropagation();
          state.messageDetailId = "";
          queueRender();
          return;
        }

        const homeService = event.target.closest("[data-home-service]");
        if (homeService) {
          event.preventDefault();
          event.stopPropagation();
          handleHomeService(homeService.dataset.homeService);
          return;
        }

        const preference = event.target.closest("[data-home-preference]");
        if (preference) {
          const resident = getResident();
          if (resident) {
            state.homePreferenceByResident[resident.id] = preference.dataset.homePreference;
          }
          window.setTimeout(queueRender, 0);
          return;
        }

        const nav = event.target.closest("[data-tab]");
        if (nav && nav.dataset.tab !== "messages") {
          state.messageDetailId = "";
          window.setTimeout(queueRender, 0);
          return;
        }

        const confirmOption = event.target.closest("[data-confirm-option]");
        if (confirmOption) {
          state.messageDetailId = "incident";
          window.setTimeout(function () {
            switchTab("messages");
            queueRender();
          }, 0);
          return;
        }

        const openOption = event.target.closest("[data-open-option]");
        if (openOption) {
          window.setTimeout(queueRender, 0);
          return;
        }

        const volunteerTask = event.target.closest("[data-volunteer-task-id]");
        if (volunteerTask) {
          window.setTimeout(queueRender, 0);
        }
      },
      true
    );
  }

  function queueRender() {
    if (renderTimer) {
      window.cancelAnimationFrame(renderTimer);
    }
    renderTimer = window.requestAnimationFrame(function () {
      renderTimer = window.requestAnimationFrame(render);
    });
  }

  function render() {
    const shared = getShared();
    const resident = getResident(shared);
    const incident = resident ? getIncident(shared, resident.id) : null;

    if (!resident || !incident) {
      return;
    }

    const account = window.ChangLouStore.getResidentAccountState(resident);
    const level = window.ChangLouStore.getLevelSnapshot(resident);
    const activeTab = getActiveTab();

    renderHeader(activeTab);

    if (activeTab === "home") {
      renderHome(resident, incident, shared, account, level);
    }

    if (activeTab === "messages") {
      renderMessageDetail(resident, incident, account);
      renderMessages(resident, incident, shared, account, level);
    } else if (elements.messageDetail) {
      elements.messageDetail.hidden = true;
      elements.messageDetail.innerHTML = "";
    }

    renderFab(activeTab, resident, incident);
  }

  function renderHeader(activeTab) {
    const titleMap = {
      home: {
        title: "我可以做什么",
        note: "常用服务、相关提醒和奖励动态都在这里。"
      },
      volunteer: {
        title: "顺手做一点，也会被看见",
        note: "把志愿服务做成短时长、低门槛、做完就有反馈的任务大厅。"
      },
      messages: {
        title: "消息中心",
        note: "被提醒、到账变化和邻里动态，都从这里进入对应详情。"
      },
      family: {
        title: "家人一起处理更安心",
        note: "代办关系、同步状态和适老支持都在这一页。"
      },
      mine: {
        title: "我的积分、权益和成就",
        note: "把账户感、到账感和可使用感做成真的愿意反复打开的资产页。"
      }
    };

    const meta = titleMap[activeTab] || titleMap.home;
    if (elements.title) {
      elements.title.textContent = meta.title;
    }
    if (elements.titleNote) {
      elements.titleNote.textContent = meta.note;
    }
    if (elements.header) {
      elements.header.classList.toggle("resident-header-home", activeTab === "home");
    }
  }

  function renderHome(resident, incident, shared, account, level) {
    renderStatusCard(resident, incident, shared, account, level);
    renderHomeServices(resident, incident);
    renderHomeDigest(resident, incident, account);
    renderHomeOptions(resident, incident, account);
    renderHomeDecisionHelper(resident, incident, account);
    renderHomeVolunteerSummary(resident, shared);
    renderHomeReward(resident, incident, account, level);
  }

  function renderStatusCard(resident, incident, shared, account, level) {
    const pendingMatters = incident.status === "completed" ? 0 : 1;
    const openTasks = shared.volunteerTasks.filter(function (task) {
      return task.status === "open" && (!task.targetResidentId || task.targetResidentId !== resident.id);
    }).length;

    elements.statusCard.innerHTML = [
      '<div class="home-greeting-row">',
      '  <div class="home-greeting-user">',
      '    <span class="resident-avatar resident-avatar-home">' + resident.name.slice(0, 1) + "</span>",
      "    <div>",
      '      <p class="eyebrow">畅楼生活</p>',
      "      <h2>" + resident.name + "，您好</h2>",
      '      <p class="home-greeting-note">平时常用的服务入口、当前提醒和共治奖励，都从这里开始。</p>',
      "    </div>",
      "  </div>",
      '  <button class="home-message-button" data-switch-tab="messages" type="button">消息' +
        (pendingMatters ? " · " + pendingMatters : "") +
        "</button>",
      "</div>",
      '<div class="home-location-pill">',
      '  <span class="home-location-dot"></span>',
      "  <span>" + incident.building + " " + resident.room + "</span>",
      '  <span class="home-location-separator"></span>',
      "  <span>" + resident.identity + "</span>",
      "</div>",
      '<div class="home-status-grid">',
      renderMiniCard("常用服务", HOME_SERVICES.length + " 项常驻入口", "不等提醒，也能主动预约清理、清运或回收"),
      renderMiniCard("当前事项", pendingMatters ? "有 1 条待查看" : "当前没有新提醒", pendingMatters ? incident.currentStage : "首页会继续保留服务入口和动态摘要"),
      renderMiniCard("奖励动态", account.pendingEntries.length + " 条待到账", resident.rewardSummary),
      renderMiniCard("共治参与", level.title, "当前可报名 " + openTasks + " 个志愿任务"),
      "</div>"
    ].join("");
  }

  function renderHomeServices(resident, incident) {
    elements.currentEvent.innerHTML = [
      '<article class="home-service-grid-card">',
      '  <div class="row-between home-inline-heading">',
      "    <div>",
      '      <p class="kicker">常用服务</p>',
      "      <h3>先看我可以做什么</h3>",
      "    </div>",
      '    <span class="tag">固定入口</span>',
      "  </div>",
      '  <div class="home-service-grid">',
      HOME_SERVICES.map(function (service) {
        return [
          '<button class="home-service-shortcut" data-home-service="' + service.id + '" type="button">',
          '  <span class="home-service-icon" aria-hidden="true">' + getHomeServiceIcon(service.id) + "</span>",
          "  <strong>" + service.title + "</strong>",
          "  <span>" + service.note + "</span>",
          "</button>"
        ].join("");
      }).join(""),
      "  </div>",
      "</article>"
    ].join("");
  }

  function renderHomeDigest(resident, incident, account) {
    const progress = getProgressModel(resident, incident);
    elements.recommended.innerHTML = [
      '<article class="home-digest-card">',
      '  <div class="row-between home-inline-heading">',
      "    <div>",
      '      <p class="kicker">与我相关</p>',
      "      <h3>" + (incident.status === "completed" ? "最近这条事件已经闭环" : "你有 1 条需要查看的事项") + "</h3>",
      "    </div>",
      window.ChangLouStore.renderSeverityPill(incident.severity),
      "  </div>",
      '  <p class="helper-text">' + (incident.status === "completed" ? resident.rewardSummary : incident.title + " · " + incident.currentStage) + "</p>",
      '  <div class="home-digest-grid">',
      renderDigestMeta("当前阶段", progress.currentTitle),
      renderDigestMeta("下一步", progress.nextStep),
      renderDigestMeta("奖励状态", account.pendingEntries.length ? "有待到账奖励" : "可去资产页查看权益"),
      "  </div>",
      '  <div class="action-card-footer action-card-footer-home">',
      "    <p>" +
        (incident.status === "completed"
          ? "消息里会继续保留这条事件的处理记录、奖励状态和时间线。"
          : "事件详情、方案选择、进度和奖励状态已经从首页移到消息中心承接。") +
        "</p>",
      '    <button class="primary-button home-cta-button" data-open-message-detail="incident" type="button">' +
        (incident.status === "completed" ? "去消息里看记录" : "从消息查看详情") +
        "</button>",
      "  </div>",
      "</article>"
    ].join("");
  }

  function renderHomeOptions(resident, incident, account) {
    const options = window.ChangLouStore.getResidentOptions(resident.id);
    const primary = resolveHomePrimaryOption(resident, options);
    const quick = [primary].concat(
      options.filter(function (item) {
        return item.id !== primary.id;
      })
    ).slice(0, 3);

    elements.options.innerHTML = quick.map(function (option) {
      return renderQuickOptionCard(option, resident, incident, account);
    }).join("");
  }

  function renderHomeDecisionHelper(resident, incident, account) {
    const activePreference = getHomePreference(resident.id);
    const options = window.ChangLouStore.getResidentOptions(resident.id);
    const matchedOption = resolveHomePrimaryOption(resident, options);
    const meta = getOptionMeta(matchedOption.id, resident.id);
    const rewardText = getRewardCopy(matchedOption.id, account, incident);
    const preference = HOME_PREFERENCES.find(function (item) {
      return item.id === activePreference;
    }) || HOME_PREFERENCES[0];

    elements.decisions.innerHTML = [
      '<article class="decision-helper-card service-launch-card">',
      '  <div class="decision-helper-head">',
      "    <div>",
      '      <p class="kicker">主动服务入口</p>',
      "      <h3>想主动处理家中杂物？先告诉我你更在意什么</h3>",
      "    </div>",
      '    <span class="tag">平时也能用</span>',
      "  </div>",
      '  <p class="helper-text">首页先给你推荐路径，再让你进入具体确认，不需要先读完整说明。</p>',
      '  <div class="decision-chip-row">',
      HOME_PREFERENCES.map(function (item) {
        return '<button class="decision-choice-chip ' + (item.id === activePreference ? "is-active" : "") + '" data-home-preference="' + item.id + '" type="button">' + item.label + "</button>";
      }).join(""),
      "  </div>",
      '  <article class="decision-result-card service-launch-result">',
      "    <div>",
      '      <p class="eyebrow">按这个偏好，当前更适合</p>',
      "      <h3>" + matchedOption.title + "</h3>",
      '      <p class="helper-text">' + preference.note + " " + meta.nextStep + "</p>",
      "    </div>",
      '    <div class="decision-result-grid">',
      renderDigestMeta("预计耗时", meta.duration),
      renderDigestMeta("可得奖励", rewardText),
      "    </div>",
      '    <button class="primary-button home-cta-button" data-open-option="' + matchedOption.id + '" type="button">立即发起</button>',
      "  </article>",
      "</article>"
    ].join("");
  }

  function renderHomeVolunteerSummary(resident, shared) {
    const recommendedTask = getVolunteerTasks(resident, shared, "recommended").find(function (task) {
      return task.status === "open";
    });
    const latestResult = shared.buildingResults[0];

    elements.progress.innerHTML = [
      '<article class="home-side-summary-card">',
      '  <div class="row-between home-inline-heading">',
      "    <div>",
      '      <p class="kicker">志愿推荐</p>',
      "      <h3>" + (recommendedTask ? "有一项顺手就能参与的任务" : "暂时没有新的推荐任务") + "</h3>",
      "    </div>",
      '    <button class="inline-link" data-switch-tab="volunteer" type="button">去任务大厅</button>',
      "  </div>",
      '  <p class="helper-text">' +
        (recommendedTask
          ? recommendedTask.title + " · " + recommendedTask.duration + " · 完成后可得 " + recommendedTask.rewardPoints + " 贡献积分"
          : "任务发布、报名和成果沉淀都会从任务大厅继续承接。") +
        "</p>",
      '  <div class="home-digest-grid">',
      renderDigestMeta("邻里结果", latestResult ? latestResult.title : "成果墙正在累计中"),
      renderDigestMeta("当前状态", recommendedTask ? "可立即报名" : "等待新任务"),
      "  </div>",
      "</article>"
    ].join("");
  }

  function renderHomeReward(resident, incident, account, level) {
    const totalAssets = account.resident.available + account.volunteer.available;
    const recentCredit = account.recentCredits[0]
      ? account.recentCredits[0].title
      : "处理闭环后会自动同步到账记录";

    elements.reward.innerHTML = [
      '<article class="home-side-summary-card reward-summary-card-home">',
      '  <div class="row-between home-inline-heading">',
      "    <div>",
      '      <p class="kicker">奖励权益</p>',
      "      <h3>账户、到账和可用权益都能随手看见</h3>",
      "    </div>",
      '    <button class="inline-link" data-switch-tab="mine" type="button">去我的</button>',
      "  </div>",
      '  <div class="reward-summary-grid reward-summary-grid-home">',
      renderDigestMeta("总资产感", String(totalAssets)),
      renderDigestMeta("待到账", String(account.pendingEntries.length)),
      renderDigestMeta("可用权益", String(account.availableBenefits.length)),
      renderDigestMeta("最近到账", recentCredit),
      "  </div>",
      '  <p class="reward-summary-note">' + incident.rewardSuggestion + "</p>",
      "</article>"
    ].join("");
  }

  function renderMessages(resident, incident, shared, account, level) {
    if (!elements.messages || !elements.messageFilters) {
      return;
    }

    const activeFilter = getActiveMessageFilter();
    elements.messageFilters.innerHTML = MESSAGE_FILTERS.map(function (filter) {
      return '<button class="segment-chip ' + (filter.id === activeFilter ? "is-active" : "") + '" data-message-filter="' + filter.id + '" type="button">' + filter.label + "</button>";
    }).join("");

    const messages = buildMessages(resident, incident, shared, account, level);
    const filtered = activeFilter === "all"
      ? messages
      : messages.filter(function (item) {
          return item.group === activeFilter;
        });

    if (!filtered.length) {
      elements.messages.innerHTML = [
        '<article class="empty-state empty-state-card">',
        "  <div>",
        "    <h3>这一类消息暂时没有新的变化</h3>",
        "    <p>有新的提醒、到账记录或邻里任务时，这里会自动更新。</p>",
        "  </div>",
        "</article>"
      ].join("");
      return;
    }

    elements.messages.innerHTML = filtered.map(function (item) {
      const actionButton = item.actionType === "detail"
        ? '<button class="ghost-button" data-open-message-detail="' + (item.actionDetailId || "incident") + '" type="button">' + item.actionLabel + "</button>"
        : item.actionTab
        ? '<button class="ghost-button" data-switch-tab="' + item.actionTab + '" type="button">' + item.actionLabel + "</button>"
        : "";

      return [
        '<article class="message-card ' + (item.highlight ? "is-highlight" : "") + '">',
        '  <div class="message-item-head">',
        "    <strong>" + item.type + "</strong>",
        "    <span>" + item.time + "</span>",
        "  </div>",
        "  <h3>" + item.title + "</h3>",
        "  <p>" + item.body + "</p>",
        "  " + actionButton,
        "</article>"
      ].join("");
    }).join("");
  }

  function renderMessageDetail(resident, incident, account) {
    if (!elements.messageDetail) {
      return;
    }

    if (state.messageDetailId !== "incident") {
      elements.messageDetail.hidden = true;
      elements.messageDetail.innerHTML = "";
      return;
    }

    const options = window.ChangLouStore.getResidentOptions(resident.id);
    const primary = incident.selectedPath
      ? getOptionById(resident.id, incident.selectedPath)
      : resolveHomePrimaryOption(resident, options);
    const secondary = options.filter(function (item) {
      return item.id !== primary.id;
    });
    const progress = getProgressModel(resident, incident);

    elements.messageDetail.hidden = false;
    elements.messageDetail.innerHTML = [
      '<article class="message-detail-shell">',
      '  <div class="row-between home-inline-heading">',
      "    <div>",
      '      <p class="kicker">事件详情</p>',
      "      <h3>" + incident.title + "</h3>",
      "    </div>",
      '    <button class="ghost-button" data-close-message-detail type="button">收起</button>',
      "  </div>",
      '  <article class="message-detail-summary-card">',
      '    <div class="row-between">',
      "      <div>",
      "        <strong>" + progress.currentTitle + "</strong>",
      "        <p>" + incident.summary + "</p>",
      "      </div>",
      window.ChangLouStore.renderSeverityPill(incident.severity),
      "    </div>",
      '    <div class="tag-row">',
      '      <span class="tag">' + incident.deadlineText + "</span>",
      '      <span class="tag">' + progress.owner + "</span>",
      '      <span class="tag">' + progress.userActionShort + "</span>",
      "    </div>",
      "  </article>",
      '  <div class="message-detail-block">' + renderOptionCard(primary, resident, incident, account, true) + "</div>",
      '  <div class="resident-home-options-grid resident-message-option-grid">' +
        secondary.map(function (option) {
          return renderOptionCard(option, resident, incident, account, false);
        }).join("") +
        "</div>",
      getEventProgressMarkup(progress, account),
      getEventRewardMarkup(resident, incident, account),
      "</article>"
    ].join("");
  }

  function renderQuickOptionCard(option, resident, incident, account) {
    const meta = getOptionMeta(option.id, resident.id);
    const visual = getOptionVisualMeta(option.id);
    const selected = resident.selectedOption === option.id;
    return [
      '<article class="home-quick-option-card action-card-tone-' + visual.tone + " " + (selected ? "is-selected" : "") + '">',
      '  <div class="home-quick-option-head">',
      '    <span class="action-visual-mark" aria-hidden="true">' + visual.mark + "</span>",
      "    <div>",
      '      <p class="option-kicker">' + (selected ? "当前已选" : "主动服务") + "</p>",
      "      <h3>" + option.title + "</h3>",
      "    </div>",
      "  </div>",
      '  <p class="helper-text">' + meta.suit + "</p>",
      '  <div class="tag-row">',
      '    <span class="tag">' + meta.duration + "</span>",
      '    <span class="tag">' + getRewardCopy(option.id, account, incident) + "</span>",
      "  </div>",
      '  <button class="ghost-button home-option-button" data-open-option="' + option.id + '" type="button">' +
        (selected ? "查看当前方案" : option.actionLabel) +
        "</button>",
      "</article>"
    ].join("");
  }

  function renderOptionCard(option, resident, incident, account, featured) {
    const meta = getOptionMeta(option.id, resident.id);
    const visual = getOptionVisualMeta(option.id);
    const selected = resident.selectedOption === option.id;
    const rewardText = getRewardCopy(option.id, account, incident);
    const tagText = selected ? "当前方案" : featured ? "最省心" : option.tag;

    return [
      '<article class="action-card ' +
        (featured ? "action-card-primary action-card-home-hero" : "action-card-secondary action-card-home-option") +
        " action-card-tone-" + visual.tone + " " + (selected ? "is-selected" : "") + '">',
      '  <div class="action-card-head action-card-head-home">',
      '    <div class="action-copy-stack">',
      '      <p class="option-kicker">' + (selected ? "当前已选" : featured ? "推荐方案" : "备选方案") + "</p>",
      "      <h3>" + option.title + "</h3>",
      '      <p class="action-card-summary">' + option.note + "</p>",
      "    </div>",
      '    <div class="action-badge-stack">',
      '      <span class="tag ' + (selected ? "tag-strong" : featured ? "tag-warm" : "") + '">' + tagText + "</span>",
      '      <span class="action-visual-mark" aria-hidden="true">' + visual.mark + "</span>",
      "    </div>",
      "  </div>",
      '  <div class="action-chip-row">' + visual.highlights.map(function (item) {
        return '<span class="solution-chip">' + item + "</span>";
      }).join("") + "</div>",
      '  <div class="action-fact-grid action-fact-grid-home">',
      renderFact("适合谁", meta.suit),
      renderFact("预计耗时", meta.duration),
      renderFact("处理成本", meta.cost),
      renderFact("可得奖励", rewardText),
      renderFact("后续服务", meta.service, true),
      "  </div>",
      '  <div class="action-card-footer action-card-footer-home">',
      "    <p><strong>点下去后：</strong>" + meta.nextStep + "</p>",
      '    <button class="' + (featured ? "primary-button home-cta-button" : "ghost-button home-option-button") + '" data-open-option="' + option.id + '" type="button">' +
        (selected ? "查看当前方案" : featured ? option.actionLabel : "看看这个方案") +
        "</button>",
      "  </div>",
      "</article>"
    ].join("");
  }

  function getEventProgressMarkup(progress, account) {
    const pendingReward = account.pendingEntries.length
      ? "待到账 " + account.pendingEntries.length + " 项"
      : account.availableBenefits.length
      ? account.availableBenefits.length + " 项权益可用"
      : "闭环后会自动同步到账";

    return [
      '<article class="order-progress-card message-detail-progress-card">',
      '  <div class="order-stepper">',
      progress.steps.map(function (step) {
        return '<article class="order-step ' + step.state + '"><span>' + step.index + "</span><strong>" + step.label + "</strong></article>";
      }).join(""),
      "  </div>",
      '  <article class="order-current-card">',
      "    <div>",
      '      <p class="eyebrow">当前在办</p>',
      "      <h3>" + progress.currentTitle + "</h3>",
      '      <p class="helper-text">' + progress.currentNote + "</p>",
      "    </div>",
      '    <span class="tag ' + (progress.needsUser ? "tag-warm" : "tag-strong") + '">' + progress.userActionShort + "</span>",
      "  </article>",
      '  <div class="order-meta-grid">',
      renderDigestMeta("预计下一步", progress.nextStep),
      renderDigestMeta("谁在处理", progress.owner),
      renderDigestMeta("你还需不需要做事", progress.userAction),
      "  </div>",
      '  <div class="order-log-list">',
      progress.logs.map(function (item, index) {
        return '<article class="order-log-item ' + (index === 0 ? "is-current" : "") + '"><span></span><p>' + item + "</p></article>";
      }).join(""),
      "  </div>",
      '  <article class="reward-inline-card">',
      "    <div>",
      '      <p class="eyebrow">奖励状态</p>',
      "      <strong>" + pendingReward + "</strong>",
      "    </div>",
      '    <button class="ghost-button" data-switch-tab="mine" type="button">去资产页查看</button>',
      "  </article>",
      "</article>"
    ].join("");
  }

  function getEventRewardMarkup(resident, incident, account) {
    const pendingCopy = account.pendingEntries.length
      ? account.pendingEntries.map(function (item) { return item.title; }).slice(0, 2).join(" · ")
      : incident.rewardSuggestion;
    const availableBenefits = account.availableBenefits.length
      ? account.availableBenefits.map(function (item) { return item.title; }).slice(0, 2).join(" · ")
      : "当前还没有立刻可用的权益";

    return [
      '<article class="reward-summary-card reward-summary-card-home message-detail-reward-card">',
      '  <div class="reward-summary-head">',
      "    <div>",
      '      <p class="eyebrow">本次奖励</p>',
      "      <h3>" + resident.rewardSummary + "</h3>",
      "    </div>",
      '    <button class="ghost-button home-option-button" data-switch-tab="mine" type="button">去我的资产</button>',
      "  </div>",
      '  <div class="reward-summary-grid reward-summary-grid-home">',
      renderDigestMeta("待到账", pendingCopy),
      renderDigestMeta("可用权益", availableBenefits),
      "  </div>",
      '  <p class="reward-summary-note">事件闭环后，积分和权益会继续同步到你的账户，不需要额外领取。</p>',
      "</article>"
    ].join("");
  }

  function buildMessages(resident, incident, shared, account, level) {
    const progress = getProgressModel(resident, incident);
    const list = [
      {
        group: "processing",
        type: incident.status === "completed" ? "处理结果" : "办理提醒",
        title: incident.status === "completed" ? "最近这条事件已经闭环" : "有一条需要你查看的事件",
        body: incident.status === "completed"
          ? incident.title + " 已经处理完成，奖励和处理记录会继续留在详情里。"
          : incident.title + " · 当前阶段：" + progress.currentTitle + "。点击后继续看方案、进度和奖励状态。",
        time: "刚刚",
        highlight: incident.status !== "completed",
        actionType: "detail",
        actionDetailId: "incident",
        actionLabel: incident.status === "completed" ? "看记录" : "去处理"
      },
      {
        group: "processing",
        type: resident.family.agent.indexOf("无需") >= 0 ? "办理说明" : "家人同步",
        title: resident.family.agent.indexOf("无需") >= 0 ? "这单支持你自己直接处理" : resident.family.agent + " 已收到同步",
        body: resident.family.agent.indexOf("无需") >= 0
          ? "当前不需要额外代办人，流程已经按本人办理做了简化。"
          : "处理进度、奖励状态和下一步建议，都会继续同步给代办家人。",
        time: "今天",
        highlight: false,
        actionTab: "family",
        actionLabel: "看家人页"
      },
      {
        group: "account",
        type: "奖励动态",
        title: "本次奖励状态有更新",
        body: resident.rewardSummary,
        time: "今天",
        highlight: account.pendingEntries.length > 0,
        actionTab: "mine",
        actionLabel: "看我的资产"
      },
      {
        group: "account",
        type: "账户动态",
        title: "你的共治账户正在累计",
        body: "现在有 " + account.resident.available + " 住户积分、" + account.volunteer.available + " 贡献积分，当前等级是 " + level.title + "。",
        time: "今天",
        highlight: false,
        actionTab: "mine",
        actionLabel: "去资产页"
      }
    ];

    const openTask = shared.volunteerTasks.find(function (task) {
      return task.status === "open" && (!task.targetResidentId || task.targetResidentId !== resident.id);
    });
    if (openTask) {
      list.unshift({
        group: "community",
        type: "志愿任务",
        title: "有一项适合你的新任务",
        body: openTask.title + " · 预计 " + openTask.duration + " · 完成后可得 " + openTask.rewardPoints + " 贡献积分。",
        time: "刚刚",
        highlight: false,
        actionTab: "volunteer",
        actionLabel: "去任务大厅"
      });
    }

    const latestResult = shared.buildingResults[0];
    if (latestResult) {
      list.push({
        group: "community",
        type: "成果提醒",
        title: "楼栋成果墙有新变化",
        body: latestResult.title + " · " + latestResult.metric,
        time: latestResult.updatedAt || "今天",
        highlight: false,
        actionTab: "volunteer",
        actionLabel: "去看成果"
      });
    }

    return list;
  }

  function getVolunteerTasks(resident, shared, filter) {
    const residentBuilding = resident.room.split(" ")[0];
    const tasks = shared.volunteerTasks.filter(function (task) {
      return task.status !== "draft" && (!task.targetResidentId || task.targetResidentId !== resident.id || task.assigneeResidentId === resident.id);
    });

    if (filter === "mine") {
      return tasks.filter(function (task) {
        return task.assigneeResidentId === resident.id;
      });
    }

    if (filter === "nearby") {
      const nearby = tasks.filter(function (task) {
        return task.building && task.building.indexOf(residentBuilding.replace("号楼", "")) >= 0;
      });
      return nearby.length ? nearby : tasks.filter(function (task) { return task.status === "open"; });
    }

    return tasks.slice().sort(function (a, b) {
      return getTaskScore(resident, b) - getTaskScore(resident, a);
    }).filter(function (task) {
      return task.status === "open" || task.assigneeResidentId === resident.id || task.status === "completed";
    });
  }

  function getTaskScore(resident, task) {
    let score = 0;
    if (task.status === "open") {
      score += 4;
    }
    if (task.type === "轻任务") {
      score += 3;
    }
    if (resident.tags.indexOf("可参与志愿") >= 0) {
      score += 2;
    }
    if (resident.room.indexOf(task.building.replace("号楼", "")) >= 0) {
      score += 1;
    }
    return score;
  }

  function getProgressModel(resident, incident) {
    const hasPath = Boolean(incident.selectedPath);
    const isClosed = incident.status === "completed";
    const currentIndex = isClosed ? 5 : hasPath ? 4 : 3;
    const pathLabel = hasPath ? getOptionById(resident.id, incident.selectedPath).title : "待你选择方案";
    const logs = incident.timeline.slice().reverse();

    let owner = "等你处理";
    let nextStep = "先选一个最省心的处理方式";
    let userAction = "需要你先确认方案";
    let userActionShort = "待你处理";
    let currentTitle = "等待你确认处理方式";
    let currentNote = "系统已经把可选路径和奖励说明整理好了，先选一个最容易开始的。";
    let needsUser = true;

    if (hasPath) {
      owner = incident.selectedPath === "self_clear" ? "你自己" : "物业 / 服务协同";
      nextStep =
        incident.selectedPath === "storage"
          ? "物业确认周转位并安排后续协助"
          : incident.selectedPath === "recycle"
          ? "回收服务上门并完成交接"
          : incident.selectedPath === "cleanup"
          ? "清运安排上门并回访销项"
          : "等待今晚回访确认";
      userAction = incident.selectedPath === "self_clear" ? "今晚自己处理后，等系统回访确认" : "你现在暂时不用额外操作";
      userActionShort = incident.selectedPath === "self_clear" ? "等你处理" : "系统推进中";
      currentTitle = "当前方案：" + pathLabel;
      currentNote = incident.currentStage;
      needsUser = incident.selectedPath === "self_clear";
    }

    if (isClosed) {
      owner = "系统已归档";
      nextStep = "奖励自动到账，成果同步到成果墙";
      userAction = "你现在不用再操作";
      userActionShort = "已完成";
      currentTitle = "本次处理已经闭环";
      currentNote = "处理结果、奖励变化和成果沉淀都已经同步完成。";
      needsUser = false;
    }

    return {
      currentTitle: currentTitle,
      currentNote: currentNote,
      nextStep: nextStep,
      owner: owner,
      userAction: userAction,
      userActionShort: userActionShort,
      needsUser: needsUser,
      logs: logs,
      steps: [
        { index: "1", label: "已发现", state: "done" },
        { index: "2", label: "已提醒", state: "done" },
        { index: "3", label: "选方案", state: currentIndex === 3 ? "current" : currentIndex > 3 ? "done" : "upcoming" },
        { index: "4", label: "处理中", state: currentIndex === 4 ? "current" : currentIndex > 4 ? "done" : "upcoming" },
        { index: "5", label: "已闭环", state: currentIndex === 5 ? "current" : "upcoming" }
      ]
    };
  }

  function getOptionMeta(optionId, residentId) {
    const defaults = {
      storage: {
        suit: "家里物品较多，想先挪走再慢慢处理",
        duration: "1 分钟提交，48 小时缓冲",
        cost: "你先确认，后续由物业承接",
        service: "物业预留周转位，并可继续协助上门",
        nextStep: "系统同步生成记录，物业确认周转位并安排后续协助"
      },
      recycle: {
        suit: "想一次预约完成，可直接交回收的物品较多",
        duration: "30 秒确认时段",
        cost: "按预约时间配合交接",
        service: "系统生成回收工单，物业协同跟进进度",
        nextStep: "系统同步回收工单，按预约时段上门回收"
      },
      cleanup: {
        suit: "更想省力处理，需要人上门搬运",
        duration: "30 秒发起，等上门确认",
        cost: "少自己动手，由服务或物业承接",
        service: "物业或服务商安排清运，并在完成后回访",
        nextStep: "系统进入清运队列，等待物业或服务商接单"
      },
      self_clear: {
        suit: "今晚能自己处理，希望减少打扰",
        duration: "10 秒登记，晚间自动回访",
        cost: "需要你自己完成整理",
        service: "系统保留一次回访提醒，不重复催促",
        nextStep: "系统记录今晚自行处理，并在回访后确认闭环"
      }
    };

    if (residentId === "R-01" && optionId === "storage") {
      return {
        suit: "高龄住户、家里物品多，先缓一步更容易推进",
        duration: "1 分钟提交，48 小时缓冲",
        cost: "先确认申请，后续由物业和家属继续衔接",
        service: "物业预留周转位，必要时继续安排助老协助",
        nextStep: "系统同步生成记录，物业先留出缓冲位，再接续处理"
      };
    }

    return defaults[optionId];
  }

  function getRewardCopy(optionId, account, incident) {
    const pending = account.pendingEntries
      .filter(function (entry) {
        return entry.id && entry.id.indexOf("pending") >= 0;
      })
      .map(function (entry) {
        return entry.title;
      });

    if (pending.length && incident.selectedPath === optionId) {
      return pending.slice(0, 2).join(" + ");
    }

    const rewardMap = {
      storage: "30 住户积分 + 兑换券",
      recycle: "20 住户积分 + 回收优先券",
      cleanup: "20 住户积分 + 清运优惠券",
      self_clear: "15 住户积分"
    };

    return rewardMap[optionId] || incident.rewardSuggestion;
  }

  function getOptionVisualMeta(optionId) {
    const visuals = {
      storage: { tone: "warm", mark: "48h", highlights: ["缓冲处理", "家属可代办", "物业继续承接"] },
      recycle: { tone: "green", mark: "R", highlights: ["上门回收", "减少浪费", "成本更轻"] },
      cleanup: { tone: "amber", mark: "Go", highlights: ["有人上门", "尽快清空", "闭环更快"] },
      self_clear: { tone: "sand", mark: "DIY", highlights: ["自己安排", "减少打扰", "回访确认"] }
    };
    return visuals[optionId] || visuals.storage;
  }

  function getHomeServiceIcon(serviceId) {
    const icons = {
      report_issue: "!",
      book_cleanup: "清",
      book_transport: "运",
      book_recycle: "收",
      view_progress: "进",
      view_rewards: "奖"
    };
    return icons[serviceId] || "服";
  }

  function getHomePreference(residentId) {
    if (!state.homePreferenceByResident[residentId]) {
      state.homePreferenceByResident[residentId] = getDefaultHomePreference(residentId);
    }
    return state.homePreferenceByResident[residentId];
  }

  function getDefaultHomePreference(residentId) {
    const defaults = {
      "R-01": "easy",
      "R-02": "fast",
      "R-03": "fast",
      "R-04": "easy"
    };
    return defaults[residentId] || "easy";
  }

  function getHomePreferenceOptionId(preferenceId, residentId) {
    const map = {
      easy: { "R-01": "storage", "R-02": "cleanup", "R-03": "cleanup", "R-04": "storage" },
      fast: { "R-01": "cleanup", "R-02": "recycle", "R-03": "cleanup", "R-04": "cleanup" },
      save: { "R-01": "recycle", "R-02": "recycle", "R-03": "recycle", "R-04": "recycle" },
      time: { "R-01": "storage", "R-02": "storage", "R-03": "self_clear", "R-04": "storage" }
    };
    return map[preferenceId] && map[preferenceId][residentId] ? map[preferenceId][residentId] : "storage";
  }

  function resolveHomePrimaryOption(resident, options) {
    const selectedOption = resident.selectedOption
      ? options.find(function (item) { return item.id === resident.selectedOption; })
      : null;
    if (selectedOption) {
      return selectedOption;
    }

    const preferredId = getHomePreferenceOptionId(getHomePreference(resident.id), resident.id);
    return options.find(function (item) { return item.id === preferredId; }) || options[0];
  }

  function getOptionById(residentId, optionId) {
    return window.ChangLouStore.getResidentOptions(residentId).find(function (item) {
      return item.id === optionId;
    });
  }

  function handleHomeService(serviceId) {
    const resident = getResident();
    const options = resident ? window.ChangLouStore.getResidentOptions(resident.id) : [];
    const recommended = resident ? resolveHomePrimaryOption(resident, options) : null;

    if (serviceId === "report_issue") {
      showToast("演示版已预留问题反馈入口，研发接表单页或拍照页即可。");
      return;
    }
    if (serviceId === "book_cleanup" && recommended) {
      clickOption(recommended.id);
      return;
    }
    if (serviceId === "book_transport") {
      clickOption("cleanup");
      return;
    }
    if (serviceId === "book_recycle") {
      clickOption("recycle");
      return;
    }
    if (serviceId === "view_progress") {
      openMessageDetail("incident");
      return;
    }
    if (serviceId === "view_rewards") {
      switchTab("mine");
    }
  }

  function clickOption(optionId) {
    const button = document.querySelector('[data-open-option="' + optionId + '"]');
    if (button) {
      button.click();
    }
  }

  function openMessageDetail(detailId) {
    state.messageDetailId = detailId || "incident";
    switchTab("messages");
    queueRender();
    window.requestAnimationFrame(function () {
      const target = document.getElementById("resident-message-detail");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  function switchTab(tab) {
    const button = document.querySelector('[data-tab="' + tab + '"]');
    if (button) {
      button.click();
    }
  }

  function showToast(message) {
    const toast = document.getElementById("resident-toast");
    if (!toast) {
      return;
    }
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () {
      toast.hidden = true;
      toast.textContent = "";
    }, 2200);
  }

  function getShared() {
    return window.ChangLouStore.getSharedState();
  }

  function getResident(shared) {
    const stateValue = shared || getShared();
    const residentId = elements.switcher ? elements.switcher.value : "";
    return stateValue.residents.find(function (item) {
      return item.id === residentId;
    }) || stateValue.residents[0];
  }

  function getIncident(shared, residentId) {
    return shared.incidents.find(function (item) {
      return item.residentId === residentId;
    });
  }

  function getActiveTab() {
    const active = document.querySelector(".resident-nav-item.is-active");
    return active ? active.dataset.tab : "home";
  }

  function getActiveMessageFilter() {
    const active = document.querySelector('#resident-message-filters .segment-chip.is-active');
    return active ? active.dataset.messageFilter : "all";
  }

  function renderMiniCard(label, value, note) {
    return '<article class="home-status-item"><span>' + label + "</span><strong>" + value + "</strong><p>" + note + "</p></article>";
  }

  function renderDigestMeta(label, value) {
    return '<article class="home-digest-meta"><span>' + label + "</span><strong>" + value + "</strong></article>";
  }

  function renderFact(label, value, isWide) {
    return '<article class="action-fact-card ' + (isWide ? "is-wide" : "") + '"><span>' + label + "</span><strong>" + value + "</strong></article>";
  }
})();
