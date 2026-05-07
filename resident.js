(function () {
  const uiStore = window.ChangLouStore.createPageStore("resident", {
    residentId: "R-01",
    activeTab: "home",
    homePreference: "",
    volunteerFilter: "recommended",
    messageFilter: "all",
    drawerOptionId: "",
    drawerOpen: false
  });

  const TAB_META = {
    home: {
      title: "先把这件事处理好",
      note: "首屏只看当前最重要的一件事，先选最省心的处理方式。"
    },
    volunteer: {
      title: "顺手做一点，也会被看见",
      note: "这里不是公告栏，而是短时长、低门槛、做完就有反馈的任务大厅。"
    },
    messages: {
      title: "提醒和进展都放在这里",
      note: "先看重要变化，再决定要不要继续操作。"
    },
    family: {
      title: "家人一起处理更安心",
      note: "代办关系、同步状态和适老支持统一放在一页。"
    },
    mine: {
      title: "你的积分、权益和成就",
      note: "把账户感、到账感和可使用感做成真正愿意反复打开的资产页。"
    }
  };

  const VOLUNTEER_FILTERS = [
    { id: "recommended", label: "推荐任务" },
    { id: "nearby", label: "就近任务" },
    { id: "mine", label: "我的参与" }
  ];

  const MESSAGE_FILTERS = [
    { id: "all", label: "全部" },
    { id: "processing", label: "办理提醒" },
    { id: "account", label: "账户动态" },
    { id: "community", label: "邻里动态" }
  ];

  const HOME_PREFERENCES = [
    { id: "easy", label: "希望省心", note: "更看重有人承接，少来回沟通。" },
    { id: "fast", label: "尽快解决", note: "更在意尽快恢复楼道通行和整洁。" },
    { id: "save", label: "想要省钱", note: "优先考虑低成本和可回收处理方式。" },
    { id: "time", label: "时间充裕", note: "可以自己安排节奏，接受分步处理。" }
  ];

  const elements = {
    appHeader: document.querySelector(".resident-app-header"),
    residentSwitcher: document.getElementById("resident-switcher"),
    statusCard: document.getElementById("status-card"),
    currentEvent: document.getElementById("resident-current-event"),
    recommendedOption: document.getElementById("resident-recommended-option"),
    options: document.getElementById("resident-options"),
    homeDecisions: document.getElementById("resident-home-decisions"),
    progress: document.getElementById("resident-progress"),
    homeReward: document.getElementById("resident-home-reward"),
    points: document.getElementById("resident-points"),
    wallet: document.getElementById("resident-wallet"),
    volunteerHero: document.getElementById("resident-volunteer-hero"),
    volunteerFilters: document.getElementById("resident-volunteer-filters"),
    volunteerTasks: document.getElementById("resident-volunteer-tasks"),
    buildingResults: document.getElementById("building-results"),
    messageFilters: document.getElementById("resident-message-filters"),
    messages: document.getElementById("resident-messages"),
    familyPanel: document.getElementById("family-panel"),
    history: document.getElementById("resident-history"),
    help: document.getElementById("resident-help"),
    reset: document.getElementById("resident-reset"),
    markAllRead: document.getElementById("mark-all-read"),
    title: document.querySelector(".resident-app-title h1"),
    titleNote: document.getElementById("resident-title-note"),
    navButtons: Array.from(document.querySelectorAll("[data-tab]")),
    panels: Array.from(document.querySelectorAll("[data-tab-panel]")),
    fab: document.getElementById("resident-fab"),
    drawerBackdrop: document.getElementById("drawer-backdrop"),
    drawer: document.getElementById("action-drawer"),
    drawerContent: document.getElementById("drawer-content"),
    toast: document.getElementById("resident-toast")
  };

  let pageData = null;
  let toastTimer = null;

  bootstrap();

  async function bootstrap() {
    pageData = await window.ChangLouStore.loadResidentPageData();
    bindEvents();
    render();
    window.addEventListener("storage", handleStorageSync);
  }

  function bindEvents() {
    elements.residentSwitcher.addEventListener("change", () => {
      uiStore.set({
        residentId: elements.residentSwitcher.value,
        homePreference: "",
        drawerOpen: false,
        drawerOptionId: ""
      });
      render();
    });

    elements.reset.addEventListener("click", () => {
      window.ChangLouStore.resetSharedState();
      uiStore.reset();
      hideToast();
      render();
    });

    elements.markAllRead.addEventListener("click", () => {
      showToast("演示版消息已标记为已读");
    });

    elements.navButtons.forEach((button) => {
      button.addEventListener("click", () => {
        switchTab(button.dataset.tab);
      });
    });

    elements.fab.addEventListener("click", handleFabClick);
    elements.drawerBackdrop.addEventListener("click", closeDrawer);
    document.body.addEventListener("click", handleBodyClick);
  }

  function handleBodyClick(event) {
    const switchTabButton = event.target.closest("[data-switch-tab]");
    if (switchTabButton) {
      switchTab(switchTabButton.dataset.switchTab);
      return;
    }

    const openOptionButton = event.target.closest("[data-open-option]");
    if (openOptionButton) {
      openDrawer(openOptionButton.dataset.openOption);
      return;
    }

    const preferenceButton = event.target.closest("[data-home-preference]");
    if (preferenceButton) {
      uiStore.set({
        homePreference: preferenceButton.dataset.homePreference,
        drawerOpen: false,
        drawerOptionId: ""
      });
      render();
      return;
    }

    const confirmOptionButton = event.target.closest("[data-confirm-option]");
    if (confirmOptionButton) {
      submitOption(confirmOptionButton.dataset.confirmOption);
      return;
    }

    const closeDrawerButton = event.target.closest("[data-close-drawer]");
    if (closeDrawerButton) {
      closeDrawer();
      return;
    }

    const volunteerFilterButton = event.target.closest("[data-volunteer-filter]");
    if (volunteerFilterButton) {
      uiStore.set({ volunteerFilter: volunteerFilterButton.dataset.volunteerFilter });
      render();
      return;
    }

    const messageFilterButton = event.target.closest("[data-message-filter]");
    if (messageFilterButton) {
      uiStore.set({ messageFilter: messageFilterButton.dataset.messageFilter });
      render();
      return;
    }

    const volunteerTaskButton = event.target.closest("[data-volunteer-task-id]");
    if (volunteerTaskButton) {
      signupVolunteerTask(volunteerTaskButton.dataset.volunteerTaskId);
      return;
    }

    const scrollTargetButton = event.target.closest("[data-scroll-target]");
    if (scrollTargetButton) {
      scrollToSection(scrollTargetButton.dataset.scrollTarget);
      return;
    }
  }

  function handleFabClick() {
    const mode = elements.fab.dataset.mode;
    if (mode === "open-option") {
      openDrawer(elements.fab.dataset.optionId);
      return;
    }
    if (mode === "progress") {
      switchTab("home");
      requestAnimationFrame(() => scrollToSection("home-progress-section"));
      return;
    }
    if (mode === "mine") {
      switchTab("mine");
    }
  }

  function handleStorageSync(event) {
    if (event.key !== window.ChangLouStore.SHARED_KEY) {
      return;
    }
    render();
  }

  function switchTab(tab) {
    const nextTab = normalizeTab(tab);
    uiStore.set({
      activeTab: nextTab,
      drawerOpen: false,
      drawerOptionId: ""
    });
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openDrawer(optionId) {
    uiStore.set({ drawerOptionId: optionId, drawerOpen: true });
    render();
  }

  function closeDrawer() {
    const ui = uiStore.get();
    if (!ui.drawerOpen && !ui.drawerOptionId) {
      return;
    }
    uiStore.set({ drawerOpen: false, drawerOptionId: "" });
    render();
  }

  function submitOption(optionId) {
    const shared = window.ChangLouStore.getSharedState();
    const resident = getCurrentResident(shared);
    if (!resident) {
      return;
    }

    const nextState = window.ChangLouStore.applyResidentOption(resident.id, optionId);
    window.ChangLouStore.setSharedState(nextState);
    uiStore.set({
      activeTab: "home",
      drawerOpen: false,
      drawerOptionId: ""
    });
    render();
    showToast(`已提交“${getOptionById(resident.id, optionId).title}”，接下来去看处理进度`);
    requestAnimationFrame(() => scrollToSection("home-progress-section"));
  }

  function signupVolunteerTask(taskId) {
    const shared = window.ChangLouStore.getSharedState();
    const resident = getCurrentResident(shared);
    if (!resident) {
      return;
    }

    const taskBefore = shared.volunteerTasks.find((item) => item.id === taskId);
    const nextState = window.ChangLouStore.applyVolunteerTaskAction(taskId, "signup", resident.id);
    const taskAfter = nextState.volunteerTasks.find((item) => item.id === taskId);
    window.ChangLouStore.setSharedState(nextState);
    render();

    if (taskBefore && taskAfter && taskBefore.status !== taskAfter.status) {
      showToast(`已报名“${taskAfter.title}”，等待中台确认`);
    }
  }

  function render() {
    const shared = window.ChangLouStore.getSharedState();
    const ui = normalizeUi(uiStore.get());
    const resident = getCurrentResident(shared, ui.residentId);
    if (!resident) {
      return;
    }

    const incident = shared.incidents.find((item) => item.residentId === resident.id);
    if (!incident) {
      return;
    }

    const account = window.ChangLouStore.getResidentAccountState(resident);
    const level = window.ChangLouStore.getLevelSnapshot(resident);
    const activeTabMeta = TAB_META[ui.activeTab];

    elements.residentSwitcher.innerHTML = shared.residents
      .map(
        (item) => `
          <option value="${item.id}" ${item.id === resident.id ? "selected" : ""}>
            ${item.name} · ${item.room}
          </option>
        `
      )
      .join("");

    elements.title.textContent =
      ui.activeTab === "home" ? `${resident.name}，这件事怎么处理最省心` : activeTabMeta.title;
    elements.titleNote.textContent = activeTabMeta.note;
    if (ui.activeTab === "home") {
      elements.title.textContent = "楼道提醒";
      elements.titleNote.textContent = "先看当前问题，再选最省心的处理方式。";
    }

    elements.title.textContent = ui.activeTab === "home" ? "畅楼生活" : activeTabMeta.title;
    elements.titleNote.textContent = ui.activeTab === "home" ? "先看当前问题，再选最省心的处理方式。" : activeTabMeta.note;
    if (elements.appHeader) {
      elements.appHeader.classList.toggle("resident-header-home", ui.activeTab === "home");
    }

    renderPanels(ui.activeTab);
    renderNav(ui.activeTab);
    renderStatusCard(resident, incident, shared, account, level);
    renderCurrentEvent(resident, incident);
    renderHomeActions(resident, incident, account, ui);
    renderDecisionHelper(resident, incident, account, ui);
    renderProgress(resident, incident, account);
    renderHomeReward(resident, incident, account);
    renderVolunteerHero(resident, shared, account);
    renderVolunteerFilters(ui.volunteerFilter);
    renderVolunteerTasks(resident, shared, ui.volunteerFilter);
    renderBuildingResults(shared);
    renderMessageFilters(ui.messageFilter);
    renderMessages(resident, incident, shared, account, level, ui.messageFilter);
    renderFamily(resident, incident);
    renderPoints(resident, account, level);
    renderWallet(resident, account);
    renderHistory(resident);
    renderHelp();
    renderFab(ui.activeTab, resident, incident);
    renderDrawer(resident, incident, account, ui);
  }

  function renderPanels(activeTab) {
    elements.panels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.tabPanel === activeTab);
    });
  }

  function renderNav(activeTab) {
    elements.navButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.tab === activeTab);
    });
  }

  function renderStatusCard(resident, incident, shared, account, level) {
    const activeTasks = shared.volunteerTasks.filter(
      (task) => task.status === "open" && (!task.targetResidentId || task.targetResidentId !== resident.id)
    ).length;
    const progress = getProgressModel(resident, incident);
    const rewardSnapshot = account.pendingEntries.length
      ? `待到账 ${account.pendingEntries.length} 笔`
      : account.availableBenefits.length
      ? `${account.availableBenefits.length} 项可用权益`
      : "闭环后会自动入账";

    elements.statusCard.innerHTML = `
      <div class="status-hero-head">
        <div class="status-hero-user">
          <span class="resident-avatar">${resident.name.slice(0, 1)}</span>
          <div>
            <p class="eyebrow">当前状态</p>
            <h2>${incident.currentStage}</h2>
          </div>
        </div>
        ${window.ChangLouStore.renderSeverityPill(incident.severity)}
      </div>
      <p class="helper-text">${incident.summary}</p>
      <div class="status-chip-grid status-chip-grid-app">
        <article class="status-chip">
          <p class="eyebrow">处理时效</p>
          <strong>${incident.deadlineText}</strong>
          <span>${getSeverityCopy(incident.severity)}</span>
        </article>
        <article class="status-chip">
          <p class="eyebrow">当前阶段</p>
          <strong>${progress.shortLabel}</strong>
          <span>${progress.userActionShort}</span>
        </article>
        <article class="status-chip">
          <p class="eyebrow">账户与参与</p>
          <strong>${level.title}</strong>
          <span>${rewardSnapshot} · 可报名任务 ${activeTasks} 个</span>
        </article>
      </div>
    `;
  }

  function renderCurrentEvent(resident, incident) {
    const selectedPath = resident.selectedOption ? getOptionById(resident.id, resident.selectedOption).title : "还没选方案";
    const whyReminder = incident.severity === "red" ? "影响消防通行，需要优先推进" : incident.severity === "yellow" ? "已经影响公共秩序，建议尽快处理" : "现在处理成本更低，也更容易闭环";

    elements.currentEvent.innerHTML = `
      <div class="task-focus-head">
        <div>
          <p class="kicker">本次事件</p>
          <h3>${incident.title}</h3>
        </div>
        ${window.ChangLouStore.renderSeverityPill(incident.severity)}
      </div>
      <p class="task-focus-summary">${incident.building} · ${resident.identity} · ${resident.profile}</p>
      <div class="task-focus-grid">
        <article class="focus-meta-card">
          <span>为什么提醒你</span>
          <strong>${whyReminder}</strong>
        </article>
        <article class="focus-meta-card">
          <span>当前最重要</span>
          <strong>${incident.selectedPath ? "继续推进当前方案" : "先选一个处理方式"}</strong>
        </article>
        <article class="focus-meta-card">
          <span>当前方案</span>
          <strong>${selectedPath}</strong>
        </article>
      </div>
      <div class="tag-row">
        <span class="tag">${resident.family.status}</span>
        <span class="tag">${incident.source}</span>
        ${incident.serviceNeeds.map((item) => `<span class="tag">${item}</span>`).join("")}
      </div>
    `;
  }

  function renderHomeActions(resident, incident, account) {
    const options = window.ChangLouStore.getResidentOptions(resident.id);
    const primaryOptionId = resident.selectedOption || options[0].id;
    const primaryOption = options.find((item) => item.id === primaryOptionId) || options[0];
    const secondaryOptions = options.filter((item) => item.id !== primaryOption.id);

    elements.recommendedOption.innerHTML = renderOptionCard(primaryOption, resident, incident, account, true);
    elements.options.innerHTML = secondaryOptions
      .map((option) => renderOptionCard(option, resident, incident, account, false))
      .join("");
  }

  function renderOptionCard(option, resident, incident, account, featured) {
    const meta = getOptionMeta(option.id, resident.id);
    const selected = resident.selectedOption === option.id;
    const tagClass = selected ? "tag tag-strong" : featured ? "tag tag-warm" : "tag";
    const titlePrefix = selected ? "当前已选" : featured ? "推荐方案" : "备选方案";
    const rewardText = getRewardCopy(option.id, account, incident);
    const facts = [
      { label: "适合谁", value: meta.suit },
      { label: "预计耗时", value: meta.duration },
      { label: "处理成本", value: meta.cost },
      { label: "可得奖励", value: rewardText },
      { label: "后续服务", value: meta.service }
    ];

    return `
      <article class="action-card ${featured ? "action-card-primary" : "action-card-secondary"} ${selected ? "is-selected" : ""}">
        <div class="action-card-head">
          <div>
            <p class="option-kicker">${titlePrefix}</p>
            <h3>${option.title}</h3>
          </div>
          <span class="${tagClass}">${selected ? "已选方案" : option.tag}</span>
        </div>
        <p class="action-card-summary">${option.note}</p>
        <div class="action-fact-grid">
          ${facts
            .map(
              (fact) => `
                <article class="action-fact-card">
                  <span>${fact.label}</span>
                  <strong>${fact.value}</strong>
                </article>
              `
            )
            .join("")}
        </div>
        <div class="action-card-footer">
          <p>点下去会发生什么：${meta.nextStep}</p>
          <button class="${featured ? "primary-button" : "ghost-button"}" data-open-option="${option.id}" type="button">
            ${selected ? "查看当前方案" : featured ? option.actionLabel : "看看这个方案"}
          </button>
        </div>
      </article>
    `;
  }

  function renderProgress(resident, incident, account) {
    const progress = getProgressModel(resident, incident);
    const pendingReward = account.pendingEntries.length
      ? `待到账 ${account.pendingEntries.length} 笔`
      : account.availableBenefits.length
      ? `${account.availableBenefits.length} 项权益可用`
      : "闭环后会自动同步到账";

    elements.progress.innerHTML = `
      <article class="order-progress-card">
        <div class="order-stepper">
          ${progress.steps
            .map(
              (step) => `
                <article class="order-step ${step.state}">
                  <span>${step.index}</span>
                  <strong>${step.label}</strong>
                </article>
              `
            )
            .join("")}
        </div>

        <article class="order-current-card">
          <div>
            <p class="eyebrow">当前在办</p>
            <h3>${progress.currentTitle}</h3>
            <p class="helper-text">${progress.currentNote}</p>
          </div>
          <span class="tag ${progress.needsUser ? "tag-warm" : "tag-strong"}">${progress.userActionShort}</span>
        </article>

        <div class="order-meta-grid">
          <article class="focus-meta-card">
            <span>预计下一步</span>
            <strong>${progress.nextStep}</strong>
          </article>
          <article class="focus-meta-card">
            <span>谁在处理</span>
            <strong>${progress.owner}</strong>
          </article>
          <article class="focus-meta-card">
            <span>你还要不要做事</span>
            <strong>${progress.userAction}</strong>
          </article>
        </div>

        <div class="order-log-list">
          ${progress.logs
            .map(
              (item, index) => `
                <article class="order-log-item ${index === 0 ? "is-current" : ""}">
                  <span></span>
                  <p>${item}</p>
                </article>
              `
            )
            .join("")}
        </div>

        <article class="reward-inline-card">
          <div>
            <p class="eyebrow">奖励状态</p>
            <strong>${pendingReward}</strong>
          </div>
          <button class="ghost-button" data-switch-tab="mine" type="button">去资产页查看</button>
        </article>
      </article>
    `;
  }

  function renderHomeReward(resident, incident, account) {
    const availableBenefits = account.availableBenefits.length
      ? account.availableBenefits.map((item) => item.title).join(" · ")
      : "当前还没有立即可用的权益";
    const pendingCopy = account.pendingEntries.length
      ? account.pendingEntries.map((item) => item.title).slice(0, 2).join(" · ")
      : incident.rewardSuggestion;

    elements.homeReward.innerHTML = `
      <article class="reward-summary-card">
        <div class="reward-summary-head">
          <div>
            <p class="eyebrow">本次奖励</p>
            <h3>${resident.rewardSummary}</h3>
          </div>
          <span class="tag ${account.pendingEntries.length ? "tag-warm" : "tag-strong"}">
            ${account.pendingEntries.length ? "待到账" : "已同步"}
          </span>
        </div>
        <div class="reward-summary-grid">
          <article class="focus-meta-card">
            <span>待到账</span>
            <strong>${pendingCopy}</strong>
          </article>
          <article class="focus-meta-card">
            <span>可用权益</span>
            <strong>${availableBenefits}</strong>
          </article>
        </div>
        <div class="action-card-footer">
          <p>这单闭环后，奖励会自动进入你的账户，不需要额外领一次。</p>
          <button class="ghost-button" data-switch-tab="mine" type="button">去我的资产</button>
        </div>
      </article>
    `;
  }

  function renderStatusCard(resident, incident, shared, account, level) {
    const options = window.ChangLouStore.getResidentOptions(resident.id);
    const primaryOption = resolveHomePrimaryOption(resident, options, normalizeUi(uiStore.get()));
    const activeTasks = shared.volunteerTasks.filter(
      (task) => task.status === "open" && (!task.targetResidentId || task.targetResidentId !== resident.id)
    ).length;
    const rewardSnapshot = account.pendingEntries.length
      ? `待到账 ${account.pendingEntries.length} 项`
      : account.availableBenefits.length
      ? `${account.availableBenefits.length} 项权益可用`
      : "闭环后自动到账";
    const supportLabel = resident.family.agent === "无需代办" ? "本人可独立处理" : "支持家人代办";
    const highlights = [
      {
        label: "处理时效",
        value: incident.deadlineText,
        note: getSeverityCopy(incident.severity)
      },
      {
        label: "推荐动作",
        value: primaryOption.title,
        note: resident.selectedOption ? "你已经锁定当前方案" : "系统先把它放在最前面"
      },
      {
        label: "协助支持",
        value: supportLabel,
        note: resident.family.status
      },
      {
        label: "奖励状态",
        value: rewardSnapshot,
        note: `${level.title} · 可参与任务 ${activeTasks} 个`
      }
    ];

    elements.statusCard.innerHTML = `
      <div class="home-greeting-row">
        <div class="home-greeting-user">
          <span class="resident-avatar resident-avatar-home">${resident.name.slice(0, 1)}</span>
          <div>
            <p class="eyebrow">楼道提醒</p>
            <h2>${resident.name}，您好</h2>
            <p class="home-greeting-note">整洁楼道，守护我们共同的家</p>
          </div>
        </div>
        <button class="home-message-button" data-switch-tab="messages" type="button">消息</button>
      </div>

      <div class="home-location-pill">
        <span class="home-location-dot"></span>
        <span>${incident.building} ${resident.room}</span>
        <span class="home-location-separator"></span>
        <span>${resident.identity}</span>
      </div>

      <article class="home-issue-hero">
        <div class="home-issue-copy">
          <div class="home-issue-title-row">
            <h3>${incident.title}</h3>
            <span class="home-urgency-pill">${getUrgencyLabel(incident.severity)}</span>
          </div>
          <p>${incident.summary}</p>
        </div>
        <div class="home-issue-emblem" aria-hidden="true">
          <span>${incident.severity === "red" ? "!" : incident.severity === "yellow" ? "*" : "+"}</span>
        </div>
      </article>

      <div class="home-status-grid">
        ${highlights
          .map(
            (item) => `
              <article class="home-status-item">
                <span>${item.label}</span>
                <strong>${item.value}</strong>
                <p>${item.note}</p>
              </article>
            `
          )
          .join("")}
      </div>
    `;
  }

  function renderCurrentEvent(resident, incident) {
    const reasons = [
      {
        label: "安全与通行",
        value:
          incident.severity === "red"
            ? "当前已经影响消防通道，越早处理越安心。"
            : incident.severity === "yellow"
            ? "已经影响公共秩序，拖久了更容易反复提醒。"
            : "现在处理成本更低，也更容易一次闭环。"
      },
      {
        label: "你现在最在意的",
        value: resident.challenge
      },
      {
        label: "处理后的结果",
        value: "闭环后会同步奖励、进度和楼栋成果，不会白做。"
      }
    ];

    elements.currentEvent.innerHTML = `
      <div class="task-focus-head">
        <div>
          <p class="kicker">当前问题</p>
          <h3>${incident.title}</h3>
        </div>
        ${window.ChangLouStore.renderSeverityPill(incident.severity)}
      </div>
      <p class="task-focus-summary">${incident.building} · ${resident.identity} · ${incident.source}</p>
      <div class="reason-chip-grid">
        ${reasons
          .map(
            (reason) => `
              <article class="reason-chip-card">
                <span>${reason.label}</span>
                <strong>${reason.value}</strong>
              </article>
            `
          )
          .join("")}
      </div>
      <div class="tag-row">
        <span class="tag">${resident.family.status}</span>
        ${incident.serviceNeeds.map((item) => `<span class="tag">${item}</span>`).join("")}
      </div>
    `;
  }

  function renderHomeActions(resident, incident, account, ui) {
    const options = window.ChangLouStore.getResidentOptions(resident.id);
    const primaryOption = resolveHomePrimaryOption(resident, options, ui);
    const secondaryOptions = options.filter((item) => item.id !== primaryOption.id);

    elements.recommendedOption.innerHTML = renderOptionCard(primaryOption, resident, incident, account, true);
    elements.options.innerHTML = secondaryOptions
      .map((option) => renderOptionCard(option, resident, incident, account, false))
      .join("");
  }

  function renderOptionCard(option, resident, incident, account, featured) {
    const meta = getOptionMeta(option.id, resident.id);
    const visual = getOptionVisualMeta(option.id);
    const selected = resident.selectedOption === option.id;
    const tagClass = selected ? "tag tag-strong" : featured ? "tag tag-warm" : "tag";
    const titlePrefix = selected ? "当前已选" : featured ? "推荐方案" : "备选方案";
    const rewardText = getRewardCopy(option.id, account, incident);
    const facts = [
      { label: "适合谁", value: meta.suit },
      { label: "预计耗时", value: meta.duration },
      { label: "处理成本", value: meta.cost },
      { label: "可得奖励", value: rewardText },
      { label: "后续服务", value: meta.service }
    ];

    return `
      <article class="action-card ${featured ? "action-card-primary action-card-home-hero" : "action-card-secondary action-card-home-option"} action-card-tone-${visual.tone} ${selected ? "is-selected" : ""}">
        <div class="action-card-head action-card-head-home">
          <div class="action-copy-stack">
            <p class="option-kicker">${titlePrefix}</p>
            <h3>${option.title}</h3>
            <p class="action-card-summary">${option.note}</p>
          </div>
          <div class="action-badge-stack">
            <span class="${tagClass}">${selected ? "当前方案" : featured ? "最省心" : option.tag}</span>
            <span class="action-visual-mark" aria-hidden="true">${visual.mark}</span>
          </div>
        </div>

        <div class="action-chip-row">
          ${visual.highlights.map((item) => `<span class="solution-chip">${item}</span>`).join("")}
        </div>

        <div class="action-fact-grid action-fact-grid-home ${featured ? "is-featured" : "is-compact"}">
          ${facts
            .map(
              (fact, index) => `
                <article class="action-fact-card ${index === facts.length - 1 ? "is-wide" : ""}">
                  <span>${fact.label}</span>
                  <strong>${fact.value}</strong>
                </article>
              `
            )
            .join("")}
        </div>

        <div class="action-card-footer action-card-footer-home">
          <p><strong>点下去后：</strong>${meta.nextStep}</p>
          <button class="${featured ? "primary-button home-cta-button" : "ghost-button home-option-button"}" data-open-option="${option.id}" type="button">
            ${selected ? "查看当前方案" : featured ? option.actionLabel : "看看这个方案"}
          </button>
        </div>
      </article>
    `;
  }

  function renderDecisionHelper(resident, incident, account, ui) {
    const activePreference = HOME_PREFERENCES.some((item) => item.id === ui.homePreference)
      ? ui.homePreference
      : getDefaultHomePreference(resident.id);
    const options = window.ChangLouStore.getResidentOptions(resident.id);
    const matchedOption = resident.selectedOption
      ? getOptionById(resident.id, resident.selectedOption)
      : resolveHomePrimaryOption(resident, options, { ...ui, homePreference: activePreference });
    const meta = getOptionMeta(matchedOption.id, resident.id);
    const rewardText = getRewardCopy(matchedOption.id, account, incident);
    const preference = HOME_PREFERENCES.find((item) => item.id === activePreference);

    elements.homeDecisions.innerHTML = `
      <article class="decision-helper-card">
        <div class="decision-helper-head">
          <div>
            <p class="kicker">简单选择一下</p>
            <h3>${resident.selectedOption ? "当前已经按这个方案推进" : "说出偏好，我们先帮你筛一轮"}</h3>
          </div>
          <span class="tag">${preference.label}</span>
        </div>
        <div class="decision-chip-row">
          ${HOME_PREFERENCES.map(
            (item) => `
              <button class="decision-choice-chip ${item.id === activePreference ? "is-active" : ""}" data-home-preference="${item.id}" type="button">
                ${item.label}
              </button>
            `
          ).join("")}
        </div>
        <article class="decision-result-card">
          <div>
            <p class="eyebrow">按这个偏好，更适合</p>
            <h3>${matchedOption.title}</h3>
            <p class="helper-text">${preference.note} ${resident.selectedOption ? "你现在看到的是已经锁定的方案。" : meta.nextStep}</p>
          </div>
          <div class="decision-result-grid">
            <article>
              <span>预计耗时</span>
              <strong>${meta.duration}</strong>
            </article>
            <article>
              <span>可得奖励</span>
              <strong>${rewardText}</strong>
            </article>
          </div>
          <button class="ghost-button home-option-button" data-open-option="${matchedOption.id}" type="button">
            ${resident.selectedOption ? "查看当前方案" : "按这个走"}
          </button>
        </article>
      </article>
    `;
  }

  function renderHomeReward(resident, incident, account) {
    const pendingCopy = account.pendingEntries.length
      ? account.pendingEntries.map((item) => item.title).slice(0, 2).join(" · ")
      : incident.rewardSuggestion;
    const availableBenefits = account.availableBenefits.length
      ? account.availableBenefits.map((item) => item.title).slice(0, 2).join(" · ")
      : "当前还没有立刻可用的权益";
    const recentCredit = account.recentCredits[0]
      ? `${account.recentCredits[0].title}${typeof account.recentCredits[0].amount === "number" ? ` +${account.recentCredits[0].amount}` : ""}`
      : "本次闭环后会直接同步到账";

    elements.homeReward.innerHTML = `
      <article class="reward-summary-card reward-summary-card-home">
        <div class="reward-summary-head">
          <div>
            <p class="eyebrow">本次奖励</p>
            <h3>${resident.rewardSummary}</h3>
          </div>
          <button class="ghost-button home-option-button" data-switch-tab="mine" type="button">去我的资产</button>
        </div>
        <div class="reward-summary-grid reward-summary-grid-home">
          <article class="focus-meta-card">
            <span>待到账</span>
            <strong>${pendingCopy}</strong>
          </article>
          <article class="focus-meta-card">
            <span>可用权益</span>
            <strong>${availableBenefits}</strong>
          </article>
          <article class="focus-meta-card">
            <span>最近到账</span>
            <strong>${recentCredit}</strong>
          </article>
          <article class="focus-meta-card">
            <span>当前等级</span>
            <strong>${window.ChangLouStore.getLevelSnapshot(resident).title}</strong>
          </article>
        </div>
        <p class="reward-summary-note">这次处理闭环后，奖励会直接进你的账户，不需要额外领取。</p>
      </article>
    `;
  }

  function renderFab(activeTab, resident, incident) {
    const options = window.ChangLouStore.getResidentOptions(resident.id);
    const ui = normalizeUi(uiStore.get());
    const recommendedOption = resolveHomePrimaryOption(resident, options, ui);

    if (activeTab !== "home") {
      elements.fab.hidden = true;
      return;
    }

    elements.fab.hidden = false;

    if (incident.status === "completed") {
      elements.fab.textContent = "去看我的资产";
      elements.fab.dataset.mode = "mine";
      elements.fab.dataset.optionId = "";
      return;
    }

    if (resident.selectedOption) {
      elements.fab.textContent = "查看处理进度";
      elements.fab.dataset.mode = "progress";
      elements.fab.dataset.optionId = "";
      return;
    }

    elements.fab.textContent = `立即${recommendedOption.title}`;
    elements.fab.dataset.mode = "open-option";
    elements.fab.dataset.optionId = recommendedOption.id;
  }

  function renderVolunteerHero(resident, shared, account) {
    const openTasks = shared.volunteerTasks.filter(
      (task) => task.status === "open" && (!task.targetResidentId || task.targetResidentId !== resident.id)
    ).length;
    const latestBadge = account.unlockedBadges[0] ? account.unlockedBadges[0].title : "完成一次任务后会解锁徽章";

    elements.volunteerHero.innerHTML = `
      <div class="volunteer-hero-card">
        <div>
          <p class="eyebrow">志愿服务</p>
          <h2>帮邻里一次，贡献积分就会进你的成长账户</h2>
          <p class="helper-text">先看适合你的短任务，再决定要不要报名。</p>
        </div>
        <div class="volunteer-hero-grid">
          <article class="focus-meta-card">
            <span>可报名任务</span>
            <strong>${openTasks} 个</strong>
          </article>
          <article class="focus-meta-card">
            <span>贡献积分</span>
            <strong>${account.volunteer.available} 分</strong>
          </article>
          <article class="focus-meta-card">
            <span>最近成就</span>
            <strong>${latestBadge}</strong>
          </article>
        </div>
      </div>
    `;
  }

  function renderVolunteerFilters(activeFilter) {
    elements.volunteerFilters.innerHTML = VOLUNTEER_FILTERS.map(
      (filter) => `
        <button
          class="segment-chip ${filter.id === activeFilter ? "is-active" : ""}"
          data-volunteer-filter="${filter.id}"
          type="button"
        >
          ${filter.label}
        </button>
      `
    ).join("");
  }

  function renderVolunteerTasks(resident, shared, activeFilter) {
    const tasks = getVolunteerTasks(resident, shared, activeFilter);

    if (!tasks.length) {
      elements.volunteerTasks.innerHTML = `
        <article class="empty-state empty-state-card">
          <div>
            <h3>当前这个分组还没有任务</h3>
            <p>先去看看推荐任务，或者等中台发布新的邻里协助事项。</p>
          </div>
        </article>
      `;
      return;
    }

    elements.volunteerTasks.innerHTML = tasks.map((task) => renderVolunteerTaskCard(task, resident)).join("");
  }

  function renderVolunteerTaskCard(task, resident) {
    const isMine = task.assigneeResidentId === resident.id;
    const matchCopy = getTaskMatchCopy(resident, task);
    const statusText =
      task.status === "open"
        ? "可报名"
        : task.status === "claimed"
        ? isMine
          ? "我已报名"
          : `已由 ${task.assigneeName} 报名`
        : "已完成";

    const actionArea =
      task.status === "open"
        ? `<button class="primary-button" data-volunteer-task-id="${task.id}" type="button">报名这个任务</button>`
        : isMine && task.status === "claimed"
        ? '<button class="ghost-button" type="button" disabled>等待中台确认完成</button>'
        : task.status === "completed"
        ? `<div class="achievement-inline">${task.outcomeSummary}</div>`
        : `<span class="tag tag-muted">${statusText}</span>`;

    return `
      <article class="task-card task-card-app ${task.status === "claimed" ? "is-claimed" : task.status === "completed" ? "is-completed" : ""}">
        <div class="task-card-head">
          <div>
            <p class="option-kicker">${task.type}</p>
            <h3>${task.title}</h3>
          </div>
          <span class="tag ${task.status === "open" ? "tag-warm" : task.status === "completed" ? "tag-strong" : ""}">
            ${statusText}
          </span>
        </div>
        <p class="action-card-summary">${task.note}</p>
        <div class="task-fact-grid">
          <article class="action-fact-card">
            <span>适合你吗</span>
            <strong>${matchCopy.suit}</strong>
          </article>
          <article class="action-fact-card">
            <span>预计时长</span>
            <strong>${task.duration}</strong>
          </article>
          <article class="action-fact-card">
            <span>完成收益</span>
            <strong>+${task.rewardPoints} 贡献积分</strong>
          </article>
          <article class="action-fact-card">
            <span>被看见结果</span>
            <strong>${task.outcomeSummary}</strong>
          </article>
        </div>
        <div class="task-match-note">
          服务对象：${task.targetResidentName} · 完成标准：${task.criteria}
        </div>
        ${actionArea}
      </article>
    `;
  }

  function renderBuildingResults(shared) {
    const results = shared.buildingResults.slice(0, 4);
    elements.buildingResults.innerHTML = results.length
      ? results.map(renderResultCard).join("")
      : `
        <article class="empty-state empty-state-card">
          <div>
            <h3>成果墙还在积累中</h3>
            <p>完成一次治理闭环或邻里协助后，这里就会出现新的成果卡。</p>
          </div>
        </article>
      `;
  }

  function renderMessageFilters(activeFilter) {
    elements.messageFilters.innerHTML = MESSAGE_FILTERS.map(
      (filter) => `
        <button
          class="segment-chip ${filter.id === activeFilter ? "is-active" : ""}"
          data-message-filter="${filter.id}"
          type="button"
        >
          ${filter.label}
        </button>
      `
    ).join("");
  }

  function renderMessages(resident, incident, shared, account, level, activeFilter) {
    const messages = buildMessages(resident, incident, shared, account, level);
    const filtered = activeFilter === "all" ? messages : messages.filter((item) => item.group === activeFilter);

    if (!filtered.length) {
      elements.messages.innerHTML = `
        <article class="empty-state empty-state-card">
          <div>
            <h3>这一类消息暂时没有新变化</h3>
            <p>有新的提醒、到账记录或邻里任务时，这里会自动更新。</p>
          </div>
        </article>
      `;
      return;
    }

    elements.messages.innerHTML = filtered
      .map(
        (item) => `
          <article class="message-card ${item.highlight ? "is-highlight" : ""}">
            <div class="message-item-head">
              <strong>${item.type}</strong>
              <span>${item.time}</span>
            </div>
            <h3>${item.title}</h3>
            <p>${item.body}</p>
            ${
              item.actionTab
                ? `<button class="ghost-button" data-switch-tab="${item.actionTab}" type="button">${item.actionLabel}</button>`
                : ""
            }
          </article>
        `
      )
      .join("");
  }

  function renderFamily(resident, incident) {
    const noDelegate = resident.family.agent.includes("无需");

    if (noDelegate) {
      elements.familyPanel.innerHTML = `
        <div class="family-page-stack">
          <article class="family-hero-card">
            <div class="row-between">
              <div>
                <p class="eyebrow">当前关系</p>
                <h3>这单可以你自己直接处理</h3>
              </div>
              <span class="tag tag-strong">${resident.family.status}</span>
            </div>
            <p class="helper-text">${resident.family.note}</p>
            <div class="order-meta-grid">
              <article class="focus-meta-card">
                <span>你可以自己做</span>
                <strong>选方案、看进度、收奖励</strong>
              </article>
              <article class="focus-meta-card">
                <span>当前不用谁配合</span>
                <strong>流程已经按本人办理简化</strong>
              </article>
            </div>
            <button class="primary-button" data-switch-tab="home" type="button">回到首页继续处理</button>
          </article>
        </div>
      `;
      return;
    }

    elements.familyPanel.innerHTML = `
      <div class="family-page-stack">
        <article class="family-hero-card">
          <div class="row-between">
            <div>
              <p class="eyebrow">当前代办人</p>
              <h3>${resident.family.agent}</h3>
            </div>
            <span class="tag tag-warm">${resident.family.status}</span>
          </div>
          <p class="helper-text">${resident.family.note}</p>
          <div class="order-meta-grid">
            <article class="focus-meta-card">
              <span>本次同步内容</span>
              <strong>${incident.currentStage}</strong>
            </article>
            <article class="focus-meta-card">
              <span>对方能帮你做</span>
              <strong>选方案、看进度、接收提醒</strong>
            </article>
          </div>
        </article>

        <article class="family-support-card">
          <div class="resident-section-heading compact">
            <div>
              <p class="kicker">代办清单</p>
              <h2>这次已经同步给家人的内容</h2>
            </div>
            <button class="ghost-button" data-switch-tab="messages" type="button">去消息页看同步</button>
          </div>
          <div class="timeline-list">
            ${resident.family.actions.map(renderTimelineItem).join("")}
            ${renderTimelineItem(`当前处理进度已同步给 ${resident.family.agent}`)}
          </div>
        </article>
      </div>
    `;
  }

  function renderPoints(resident, account, level) {
    const totalAssets = account.resident.available + account.volunteer.available;
    const recentCredits = account.recentCredits.length
      ? account.recentCredits
      : [
          {
            title: "最近到账记录会显示在这里",
            note: "完成处理或志愿任务后，账户流水会自动更新。",
            status: "credited"
          }
        ];

    elements.points.innerHTML = `
      <article class="asset-hero-card">
        <div class="asset-card-head">
          <div>
            <p class="eyebrow">账户总览</p>
            <h3>${level.title}</h3>
          </div>
          <span class="asset-total">总资产感 ${totalAssets}</span>
        </div>
        <p class="helper-text">
          ${level.pointsToNext ? `距离 ${level.nextTitle} 还差 ${level.pointsToNext} 分` : "已经达到当前展示的最高等级"}
        </p>
        <div class="progress-track"><span style="width:${level.progressPercent}%"></span></div>
      </article>

      <div class="asset-account-grid">
        <article class="points-card points-card-strong">
          <p class="eyebrow">住户积分账户</p>
          <strong>${account.resident.available}</strong>
          <p class="helper-text">已到账 ${account.resident.available} · 待到账 ${account.resident.pending}</p>
        </article>
        <article class="points-card points-card-strong">
          <p class="eyebrow">贡献积分账户</p>
          <strong>${account.volunteer.available}</strong>
          <p class="helper-text">已到账 ${account.volunteer.available} · 待到账 ${account.volunteer.pending}</p>
        </article>
      </div>

      <div class="account-status-grid">
        <article class="status-ledger-card">
          <p class="eyebrow">待到账</p>
          <strong>${account.pendingEntries.length}</strong>
          <p class="helper-text">这单闭环后会自动入账</p>
        </article>
        <article class="status-ledger-card">
          <p class="eyebrow">已到账</p>
          <strong>${account.creditedEntries.length}</strong>
          <p class="helper-text">最近到账会自动写入流水</p>
        </article>
        <article class="status-ledger-card">
          <p class="eyebrow">可用权益</p>
          <strong>${account.availableBenefits.length}</strong>
          <p class="helper-text">可以直接使用或继续累积</p>
        </article>
        <article class="status-ledger-card">
          <p class="eyebrow">已解锁</p>
          <strong>${account.unlockedEntries.length}</strong>
          <p class="helper-text">徽章、等级和成果都会记在这里</p>
        </article>
      </div>

      <article class="ledger-card">
        <div class="row-between">
          <h3>最近到账记录</h3>
          <button class="ghost-button" data-switch-tab="volunteer" type="button">继续去赚分</button>
        </div>
        <div class="points-preview-list">
          ${recentCredits.map(renderLedgerItem).join("")}
        </div>
      </article>

      <article class="badge-shelf badge-shelf-rich">
        <div class="row-between">
          <h3>徽章与等级进度</h3>
          <span class="tag tag-strong">${account.unlockedBadges.length} 枚徽章</span>
        </div>
        <div class="tag-row">
          ${
            account.unlockedBadges.length
              ? account.unlockedBadges.map((badge) => `<span class="tag tag-strong">${badge.title}</span>`).join("")
              : '<span class="tag">完成一次任务后会在这里解锁成就</span>'
          }
        </div>
      </article>
    `;
  }

  function renderWallet(resident, account) {
    const sections = [
      {
        title: "可用权益",
        hint: "现在就能用的权益",
        items: account.availableBenefits
      },
      {
        title: "待到账",
        hint: "闭环后会自动进入账户",
        items: account.pendingEntries
      },
      {
        title: "已使用",
        hint: "已经核销或使用过的权益",
        items: account.usedEntries
      },
      {
        title: "最近解锁",
        hint: "最近新增的徽章或等级",
        items: account.unlockedEntries.slice(0, 3)
      }
    ];

    elements.wallet.innerHTML = sections
      .map(
        (section) => `
          <article class="wallet-group-card">
            <div class="row-between">
              <div>
                <p class="eyebrow">${section.hint}</p>
                <h3>${section.title}</h3>
              </div>
              <span class="tag">${section.items.length}</span>
            </div>
            <div class="wallet-group-list">
              ${
                section.items.length
                  ? section.items.map(renderWalletItem).join("")
                  : renderWalletEmpty(section.title, resident)
              }
            </div>
          </article>
        `
      )
      .join("");
  }

  function renderWalletItem(item) {
    return `
      <article class="wallet-item wallet-item-rich">
        <div class="wallet-head">
          <div>
            <h3>${item.title}</h3>
            <p>${item.note}${item.createdAt ? ` · ${item.createdAt}` : ""}</p>
          </div>
          <span class="tag ${getLedgerStatusClass(item.status)}">${getLedgerStatusLabel(item.status)}</span>
        </div>
      </article>
    `;
  }

  function renderWalletEmpty(title, resident) {
    if (title === "可用权益") {
      return '<article class="wallet-empty-card">当前还没有立即可用的权益，处理完这单后就会有新变化。</article>';
    }
    if (title === "待到账") {
      return resident.selectedOption
        ? '<article class="wallet-empty-card">这单当前没有新的待到账条目，等下一次处理或志愿任务后会继续积累。</article>'
        : '<article class="wallet-empty-card">先在首页选一个处理方式，待到账奖励就会自动锁定在这里。</article>';
    }
    if (title === "已使用") {
      return '<article class="wallet-empty-card">你还没有用过权益，等到账后可以直接在这里看到使用记录。</article>';
    }
    return '<article class="wallet-empty-card">完成一次任务或升级后，这里会出现新的徽章和等级解锁记录。</article>';
  }

  function renderHistory(resident) {
    if (!resident.history.length) {
      elements.history.innerHTML = `
        <article class="empty-state empty-state-card">
          <div>
            <h3>还没有历史记录</h3>
            <p>等这次处理推进后，你的治理记录会留在这里。</p>
          </div>
        </article>
      `;
      return;
    }

    elements.history.innerHTML = resident.history
      .map(
        (item) => `
          <article class="history-item history-item-rich">
            <span></span>
            <p>${item}</p>
          </article>
        `
      )
      .join("");
  }

  function renderHelp() {
    elements.help.innerHTML = pageData.help
      .map(
        (item) => `
          <article class="help-card">
            <div>
              <p class="eyebrow">FAQ</p>
              <h3>${item.title}</h3>
            </div>
            <p class="helper-text">${item.note}</p>
          </article>
        `
      )
      .join("");
  }

  function renderFab(activeTab, resident, incident) {
    const recommendedOption = window.ChangLouStore.getResidentOptions(resident.id)[0];

    if (activeTab !== "home") {
      elements.fab.hidden = true;
      return;
    }

    elements.fab.hidden = false;

    if (incident.status === "completed") {
      elements.fab.textContent = "去看我的资产";
      elements.fab.dataset.mode = "mine";
      elements.fab.dataset.optionId = "";
      return;
    }

    if (resident.selectedOption) {
      elements.fab.textContent = "查看处理进度";
      elements.fab.dataset.mode = "progress";
      elements.fab.dataset.optionId = "";
      return;
    }

    elements.fab.textContent = `立即${recommendedOption.title}`;
    elements.fab.dataset.mode = "open-option";
    elements.fab.dataset.optionId = recommendedOption.id;
  }

  function renderDrawer(resident, incident, account, ui) {
    const option = ui.drawerOpen ? getOptionById(resident.id, ui.drawerOptionId) : null;
    if (!option) {
      elements.drawerBackdrop.hidden = true;
      elements.drawer.classList.remove("is-open");
      elements.drawer.setAttribute("aria-hidden", "true");
      elements.drawerContent.innerHTML = "";
      return;
    }

    const meta = getOptionMeta(option.id, resident.id);
    const rewardText = getRewardCopy(option.id, account, incident);
    const steps = getOptionNextSteps(option.id);
    const selected = resident.selectedOption === option.id;

    elements.drawerBackdrop.hidden = false;
    elements.drawer.classList.add("is-open");
    elements.drawer.setAttribute("aria-hidden", "false");
    elements.drawerContent.innerHTML = `
      <div class="drawer-header">
        <div>
          <p class="eyebrow">${selected ? "当前方案" : "确认方案"}</p>
          <h3>${option.title}</h3>
        </div>
        <button class="ghost-button" data-close-drawer type="button">关闭</button>
      </div>

      <p class="helper-text">${option.note}</p>

      <div class="drawer-fact-grid">
        <article class="action-fact-card">
          <span>适合谁</span>
          <strong>${meta.suit}</strong>
        </article>
        <article class="action-fact-card">
          <span>预计耗时</span>
          <strong>${meta.duration}</strong>
        </article>
        <article class="action-fact-card">
          <span>处理成本</span>
          <strong>${meta.cost}</strong>
        </article>
        <article class="action-fact-card">
          <span>可得奖励</span>
          <strong>${rewardText}</strong>
        </article>
        <article class="action-fact-card">
          <span>后续服务</span>
          <strong>${meta.service}</strong>
        </article>
      </div>

      <article class="drawer-step-card">
        <p class="eyebrow">确认后会发生什么</p>
        <div class="timeline-list">
          ${steps.map(renderTimelineItem).join("")}
        </div>
      </article>

      <div class="drawer-actions">
        <button class="ghost-button" data-close-drawer type="button">再想想</button>
        <button class="primary-button" data-confirm-option="${option.id}" type="button">
          ${selected ? "继续按这个方案处理" : option.actionLabel}
        </button>
      </div>
    `;
  }

  function buildMessages(resident, incident, shared, account, level) {
    const messages = [
      {
        group: "processing",
        type: "办理提醒",
        title: "这件事还在处理中",
        body: `${incident.title}，请在 ${incident.deadlineText} 前继续推进。`,
        time: "刚刚",
        highlight: true,
        actionTab: "home",
        actionLabel: "去处理"
      },
      {
        group: "processing",
        type: resident.family.agent.includes("无需") ? "办理说明" : "家人同步",
        title: resident.family.agent.includes("无需") ? "这单支持你自己直接处理" : `${resident.family.agent} 已收到同步`,
        body: resident.family.agent.includes("无需")
          ? "当前不需要额外代办人，流程已经为本人办理做了简化。"
          : "处理进度、奖励状态和下一步建议都会同步给代办家人。",
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
        body: `现在有 ${account.resident.available} 住户积分、${account.volunteer.available} 贡献积分，当前等级是 ${level.title}。`,
        time: "今天",
        highlight: false,
        actionTab: "mine",
        actionLabel: "去资产页"
      }
    ];

    const openTask = shared.volunteerTasks.find(
      (task) => task.status === "open" && (!task.targetResidentId || task.targetResidentId !== resident.id)
    );
    if (openTask) {
      messages.unshift({
        group: "community",
        type: "志愿任务",
        title: "有一个适合你的新任务",
        body: `${openTask.title}，预计 ${openTask.duration}，完成后可得 ${openTask.rewardPoints} 贡献积分。`,
        time: "刚刚",
        highlight: false,
        actionTab: "volunteer",
        actionLabel: "去任务大厅"
      });
    }

    const latestResult = shared.buildingResults[0];
    if (latestResult) {
      messages.push({
        group: "community",
        type: "成果提醒",
        title: "楼栋成果墙有新变化",
        body: `${latestResult.title}，${latestResult.metric}。`,
        time: latestResult.updatedAt || "今天",
        highlight: false,
        actionTab: "volunteer",
        actionLabel: "去看成果"
      });
    }

    return messages;
  }

  function getVolunteerTasks(resident, shared, filter) {
    const residentBuilding = resident.room.split(" ")[0];
    const tasks = shared.volunteerTasks.filter(
      (task) =>
        task.status !== "draft" &&
        (!task.targetResidentId || task.targetResidentId !== resident.id || task.assigneeResidentId === resident.id)
    );

    if (filter === "mine") {
      return tasks.filter((task) => task.assigneeResidentId === resident.id);
    }

    if (filter === "nearby") {
      const nearby = tasks.filter((task) => task.building && task.building.includes(residentBuilding.replace("号楼", "")));
      return nearby.length ? nearby : tasks.filter((task) => task.status === "open");
    }

    return tasks
      .slice()
      .sort((a, b) => getTaskScore(resident, b) - getTaskScore(resident, a))
      .filter((task) => task.status === "open" || task.assigneeResidentId === resident.id || task.status === "completed");
  }

  function getTaskScore(resident, task) {
    let score = 0;
    if (task.status === "open") {
      score += 4;
    }
    if (task.type === "轻任务") {
      score += 3;
    }
    if (resident.tags.includes("可参与志愿")) {
      score += 2;
    }
    if (resident.room.includes(task.building.replace("号楼", ""))) {
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
      nextStep = incident.selectedPath === "storage" ? "物业确认周转位并安排后续协助" : incident.selectedPath === "recycle" ? "回收服务上门并完成交接" : incident.selectedPath === "cleanup" ? "清运安排上门并回访销项" : "等待今晚回访确认";
      userAction = incident.selectedPath === "self_clear" ? "今晚自己处理后，等系统回访确认" : "你现在暂时不用额外操作";
      userActionShort = incident.selectedPath === "self_clear" ? "等你处理" : "系统推进中";
      currentTitle = `当前方案：${pathLabel}`;
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
      shortLabel: isClosed ? "已闭环" : hasPath ? "处理中" : "待选方案",
      currentTitle,
      currentNote,
      nextStep,
      owner,
      userAction,
      userActionShort,
      needsUser,
      logs,
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
    const pendingForThisStep = account.pendingEntries
      .filter((entry) => entry.id && entry.id.includes("pending"))
      .map((entry) => entry.title);
    if (pendingForThisStep.length && residentHasSelectedCurrentOption(optionId)) {
      return pendingForThisStep.slice(0, 2).join(" + ");
    }

    const rewardMap = {
      storage: "30 住户积分 + 兑换券",
      recycle: "20 住户积分 + 回收优先券",
      cleanup: "20 住户积分 + 清运优惠券",
      self_clear: "15 住户积分"
    };

    return rewardMap[optionId] || incident.rewardSuggestion;

    function residentHasSelectedCurrentOption(currentOptionId) {
      return incident.selectedPath === currentOptionId;
    }
  }

  function getOptionNextSteps(optionId) {
    const stepMap = {
      storage: ["系统同步生成处理记录", "物业确认周转位", "如有需要继续安排协助或清运"],
      recycle: ["系统生成回收工单", "按预约时段上门回收", "完成后自动同步奖励到账"],
      cleanup: ["系统进入清运队列", "物业或服务商安排上门", "回访销项后自动发放奖励"],
      self_clear: ["系统记录今晚自行处理", "保留一次回访提醒", "回访确认后自动发放奖励"]
    };
    return stepMap[optionId] || ["确认后会同步到中台继续推进"];
  }

  function getOptionById(residentId, optionId) {
    return window.ChangLouStore.getResidentOptions(residentId).find((item) => item.id === optionId);
  }

  function getTaskMatchCopy(resident, task) {
    const volunteerPoints = window.ChangLouStore.getResidentAccountState(resident).volunteer.available;
    if (resident.tags.includes("可参与志愿") || volunteerPoints >= 50) {
      return {
        suit: "较适合你",
        note: "你已经有共治参与经验，这类任务更容易上手。"
      };
    }

    if (task.type === "轻任务") {
      return {
        suit: "新手友好",
        note: "这类任务更轻，适合第一次参与志愿服务。"
      };
    }

    return {
      suit: "可尝试",
      note: "如果你今天时间合适，这类任务也能很快完成。"
    };
  }

  function getSeverityCopy(severity) {
    if (severity === "red") {
      return "需要优先处理";
    }
    if (severity === "yellow") {
      return "建议尽快处理";
    }
    return "可以温和推进";
  }

  function getLedgerStatusLabel(status) {
    if (status === "pending") {
      return "待到账";
    }
    if (status === "used") {
      return "已使用";
    }
    if (status === "unlocked") {
      return "已解锁";
    }
    return "已到账";
  }

  function getLedgerStatusClass(status) {
    if (status === "pending") {
      return "tag-warm";
    }
    if (status === "used") {
      return "tag-muted";
    }
    return "tag-strong";
  }

  function renderLedgerItem(item) {
    return `
      <article class="wallet-item wallet-item-inline">
        <div class="wallet-head">
          <div>
            <h3>${item.title}</h3>
            <p>${item.note}${item.createdAt ? ` · ${item.createdAt}` : ""}</p>
          </div>
          <span class="tag ${getLedgerStatusClass(item.status)}">${getLedgerStatusLabel(item.status)}</span>
        </div>
      </article>
    `;
  }

  function renderResultCard(item) {
    return `
      <article class="result-card result-card-rich">
        <div class="row-between">
          <h3>${item.title}</h3>
          <span class="tag tag-strong">${item.metric}</span>
        </div>
        <p class="helper-text">${item.summary}</p>
        <div class="tag-row">${item.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
        <p class="helper-text">更新：${item.updatedAt} · 来源：${item.owner}</p>
      </article>
    `;
  }

  function renderTimelineItem(text) {
    return `<article class="timeline-item"><p>${text}</p></article>`;
  }

  function getCurrentResident(shared, residentId) {
    return shared.residents.find((item) => item.id === (residentId || uiStore.get().residentId)) || shared.residents[0];
  }

  function resolveHomePrimaryOption(resident, options, ui) {
    const selectedOption = resident.selectedOption ? options.find((item) => item.id === resident.selectedOption) : null;
    if (selectedOption) {
      return selectedOption;
    }

    const preferredId = getHomePreferenceOptionId(
      HOME_PREFERENCES.some((item) => item.id === ui.homePreference) ? ui.homePreference : getDefaultHomePreference(resident.id),
      resident.id
    );

    return options.find((item) => item.id === preferredId) || options[0];
  }

  function getHomePreferenceOptionId(preferenceId, residentId) {
    const map = {
      easy: {
        "R-01": "storage",
        "R-02": "cleanup",
        "R-03": "cleanup",
        "R-04": "storage"
      },
      fast: {
        "R-01": "cleanup",
        "R-02": "recycle",
        "R-03": "cleanup",
        "R-04": "cleanup"
      },
      save: {
        "R-01": "recycle",
        "R-02": "recycle",
        "R-03": "recycle",
        "R-04": "recycle"
      },
      time: {
        "R-01": "storage",
        "R-02": "storage",
        "R-03": "self_clear",
        "R-04": "storage"
      }
    };

    return map[preferenceId] && map[preferenceId][residentId] ? map[preferenceId][residentId] : "storage";
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

  function getOptionVisualMeta(optionId) {
    const visuals = {
      storage: {
        tone: "warm",
        mark: "48h",
        highlights: ["缓冲处理", "家属可代办", "物业继续承接"]
      },
      recycle: {
        tone: "green",
        mark: "R",
        highlights: ["上门回收", "减少浪费", "成本更轻"]
      },
      cleanup: {
        tone: "amber",
        mark: "Go",
        highlights: ["有人上门", "尽快清空", "闭环更快"]
      },
      self_clear: {
        tone: "sand",
        mark: "DIY",
        highlights: ["自己安排", "减少打扰", "回访确认"]
      }
    };

    return visuals[optionId] || visuals.storage;
  }

  function getUrgencyLabel(severity) {
    if (severity === "red") {
      return "需要尽快处理";
    }
    if (severity === "yellow") {
      return "建议今天推进";
    }
    return "顺手处理更省心";
  }

  function renderHomeSectionHeadings() {
    const headings = Array.from(document.querySelectorAll(".resident-home-section .resident-section-heading.compact"));
    const config = [
      { kicker: "优先原因", title: "为什么建议你先把这件事处理掉", tail: "看提醒" },
      { kicker: "推荐方案", title: "先选最省心的这一个", tail: "主动作优先" },
      { kicker: "其他方案", title: "如果你更想自己安排，也有别的选法" },
      { kicker: "帮你判断", title: "先说你的偏好，我们把更顺手的方案放前面" },
      { kicker: "处理进度", title: "像订单一样看当前推进到哪一步", tail: "看资产变化" },
      { kicker: "奖励状态", title: "这单完成后，你会得到什么", tail: "去资产页" }
    ];

    headings.forEach((heading, index) => {
      const item = config[index];
      if (!item) {
        return;
      }

      const kicker = heading.querySelector(".kicker");
      const title = heading.querySelector("h2");
      const button = heading.querySelector(".inline-link");
      const tag = heading.querySelector(".tag");

      if (kicker) {
        kicker.textContent = item.kicker;
      }
      if (title) {
        title.textContent = item.title;
      }
      if (button && item.tail) {
        button.textContent = item.tail;
      }
      if (tag && item.tail) {
        tag.textContent = item.tail;
      }
    });
  }

  function normalizeUi(ui) {
    const activeTab = normalizeTab(ui.activeTab);
    const next = {
      ...ui,
      activeTab,
      homePreference: HOME_PREFERENCES.some((item) => item.id === ui.homePreference) ? ui.homePreference : "",
      volunteerFilter: VOLUNTEER_FILTERS.some((item) => item.id === ui.volunteerFilter)
        ? ui.volunteerFilter
        : "recommended",
      messageFilter: MESSAGE_FILTERS.some((item) => item.id === ui.messageFilter) ? ui.messageFilter : "all"
    };

    if (
      next.activeTab !== ui.activeTab ||
      next.homePreference !== ui.homePreference ||
      next.volunteerFilter !== ui.volunteerFilter ||
      next.messageFilter !== ui.messageFilter
    ) {
      uiStore.set(next);
    }

    return next;
  }

  function normalizeTab(tab) {
    if (tab === "wallet") {
      return "mine";
    }
    return TAB_META[tab] ? tab : "home";
  }

  function scrollToSection(id) {
    const target = document.getElementById(id);
    if (!target) {
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    if (toastTimer) {
      window.clearTimeout(toastTimer);
    }
    toastTimer = window.setTimeout(() => {
      hideToast();
    }, 2400);
  }

  function hideToast() {
    elements.toast.hidden = true;
    elements.toast.textContent = "";
    if (toastTimer) {
      window.clearTimeout(toastTimer);
      toastTimer = null;
    }
  }
})();
