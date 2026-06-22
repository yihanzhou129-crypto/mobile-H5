/**
 * 游戏逻辑引擎
 * 《如何成为一个优雅的中世纪人》H5小游戏
 */

(function() {
  'use strict';

  // === 游戏状态 ===
  const state = {
    currentScene: 0,     // 当前场景索引 (0-4)
    currentEpisode: 0,   // 当前情节索引 (0-3)
    totalScore: 0,       // 累计优雅值
    phase: 'loading',    // 当前阶段
    // 分页状态
    dialoguePages: [],   // 当前文字分页数组
    currentPage: 0,      // 当前分页
    dialogueMode: 'narration', // narration | question | feedback
    selectedOption: null,
    waitingForChoice: false
  };

  // === DOM元素引用 ===
  const dom = {};

  // === 初始化 ===
  function init() {
    cacheDom();
    bindEvents();
    checkOrientation();
    preloadAssets();
  }

  function cacheDom() {
    dom.container = document.getElementById('game-container');
    dom.homePage = document.getElementById('home-page');
    dom.homeImg = document.getElementById('home-bg');
    dom.chapterPage = document.getElementById('chapter-page');
    dom.chapterImg = document.getElementById('chapter-bg');
    dom.transitionPage = document.getElementById('transition-page');
    dom.transitionImg = document.getElementById('transition-bg');
    dom.scenePage = document.getElementById('scene-page');
    dom.sceneBg = document.getElementById('scene-bg');
    dom.choicesArea = document.getElementById('choices-area');
    dom.dialogueArea = document.getElementById('dialogue-area');
    dom.dialogueContent = document.getElementById('dialogue-content');
    dom.dialogueBg = document.getElementById('dialogue-bg');
    dom.pageHint = document.getElementById('page-hint');
    dom.resultPage = document.getElementById('result-page');
    dom.resultContainer = document.getElementById('result-container');
    dom.endingPage = document.getElementById('ending-page');
    dom.landscapeOverlay = document.getElementById('landscape-overlay');
    dom.loadingOverlay = document.getElementById('loading-overlay');
    dom.posterOverlay = document.getElementById('poster-overlay');
    dom.posterImage = document.getElementById('poster-image');
    dom.posterCanvas = document.getElementById('poster-canvas');
  }

  function bindEvents() {
    // 首页点击
    dom.homePage.addEventListener('click', () => {
      if (state.phase === 'home') startGame();
    });

    // 场景过渡页点击
    dom.transitionPage.addEventListener('click', () => {
      if (state.phase === 'transition') enterScene();
    });

    // 对话框点击（分页翻页/进入选项）
    dom.dialogueArea.addEventListener('click', (e) => {
      if (state.phase !== 'scene') return;
      e.stopPropagation();
      handleDialogueClick();
    });

    // 尾页点击
    dom.endingPage.addEventListener('click', () => {
      if (state.phase === 'ending') goHome();
    });

    // 横屏检测
    window.addEventListener('orientationchange', checkOrientation);
    window.addEventListener('resize', checkOrientation);

    // 海报关闭
    document.querySelector('.poster-close')?.addEventListener('click', () => {
      dom.posterOverlay.classList.remove('active');
    });
  }

  // === 横屏检测 ===
  function checkOrientation() {
    const isLandscape = window.innerWidth > window.innerHeight;
    dom.landscapeOverlay.style.display = isLandscape ? 'flex' : 'none';
  }

  // === 资源预加载 ===
  function preloadAssets() {
    const images = [
      '../首页及过场页面等素材/首页.jpg',
      '../首页及过场页面等素材/对话框.jpg'
    ];
    let loaded = 0;
    let shown = false;
    const total = images.length;

    function tryShowHome() {
      if (shown) return;
      shown = true;
      showHome();
    }

    images.forEach(src => {
      const img = new Image();
      img.onload = img.onerror = () => {
        loaded++;
        if (loaded >= total) {
          setTimeout(tryShowHome, 300);
        }
      };
      img.src = src;
    });

    // 超时保护
    setTimeout(tryShowHome, 3000);
  }

  // === 页面切换 ===
  function switchPage(from, to, callback) {
    if (from) {
      from.classList.add('fade-out');
      setTimeout(() => {
        from.classList.remove('active', 'fade-out');
        from.style.display = 'none';
        showPage(to, callback);
      }, 700);
    } else {
      showPage(to, callback);
    }
  }

  function showPage(page, callback) {
    page.style.display = 'flex';
    page.classList.add('active', 'fade-in');
    setTimeout(() => {
      page.classList.remove('fade-in');
      if (callback) callback();
    }, 800);
  }

  // === 首页 ===
  function showHome() {
    state.phase = 'home';
    dom.loadingOverlay.classList.add('hidden');
    dom.homeImg.src = '../首页及过场页面等素材/首页.jpg';
    dom.homePage.style.display = 'flex';
    dom.homePage.classList.add('active', 'fade-in');
    setTimeout(() => dom.homePage.classList.remove('fade-in'), 800);
  }

  // === 开始游戏 ===
  function startGame() {
    state.currentScene = 0;
    state.currentEpisode = 0;
    state.totalScore = 0;
    showChapter(0);
  }

  // === 章节过场 ===
  function showChapter(sceneIndex) {
    state.phase = 'chapter';
    state.currentScene = sceneIndex;
    state.currentEpisode = 0;
    const scene = SCENES_DATA[sceneIndex];

    dom.chapterImg.src = scene.chapterImage;
    switchPage(dom.homePage, dom.chapterPage, () => {
      // 2秒后自动进入场景过渡页
      setTimeout(() => {
        showTransition(sceneIndex);
      }, 2000);
    });
  }

  // === 场景过渡页 ===
  function showTransition(sceneIndex) {
    state.phase = 'transition';
    const scene = SCENES_DATA[sceneIndex];

    dom.transitionImg.src = scene.transitionImage;
    switchPage(dom.chapterPage, dom.transitionPage);
  }

  // === 进入场景 ===
  function enterScene() {
    state.phase = 'scene';
    const scene = SCENES_DATA[state.currentScene];

    dom.sceneBg.src = scene.bgImage;
    dom.dialogueBg.src = '../首页及过场页面等素材/对话框.jpg';

    // 清理上一场景的内容
    dom.choicesArea.innerHTML = '';
    dom.choicesArea.classList.remove('visible', 'five-options');
    dom.dialogueContent.innerHTML = '';
    dom.pageHint.classList.remove('visible');

    switchPage(dom.transitionPage, dom.scenePage, () => {
      showEpisode(state.currentScene, state.currentEpisode);
    });
  }

  // === 显示情节 ===
  function showEpisode(sceneIndex, episodeIndex) {
    const scene = SCENES_DATA[sceneIndex];
    const episode = scene.episodes[episodeIndex];

    // 重置状态
    state.selectedOption = null;
    state.waitingForChoice = false;
    state.dialogueMode = 'narration';

    // 隐藏选项
    dom.choicesArea.classList.remove('visible', 'five-options');
    dom.choicesArea.innerHTML = '';

    // 设置分页文字（narration + question）
    const allText = [...episode.narration, '||QUESTION||' + episode.question];
    state.dialoguePages = paginateText(allText);
    state.currentPage = 0;

    // 显示第一页
    renderDialoguePage();
  }

  // === 文字分页算法 ===
  function paginateText(lines) {
    // 按语义拆分，每页约2-3段文字
    const pages = [];
    let currentPage = [];
    let charCount = 0;
    const maxChars = 100; // 每页最大字符数

    for (const line of lines) {
      if (charCount + line.length > maxChars && currentPage.length > 0) {
        pages.push([...currentPage]);
        currentPage = [];
        charCount = 0;
      }
      currentPage.push(line);
      charCount += line.length;
    }

    if (currentPage.length > 0) {
      pages.push(currentPage);
    }

    return pages;
  }

  // === 渲染当前分页 ===
  function renderDialoguePage() {
    const page = state.dialoguePages[state.currentPage];
    if (!page) return;

    // 添加淡出效果后更新内容
    dom.dialogueContent.style.opacity = '0';
    setTimeout(() => {
      dom.dialogueContent.innerHTML = '';

      page.forEach((line, i) => {
        if (line.startsWith('||QUESTION||')) {
          const el = document.createElement('div');
          el.className = 'question-text';
          el.textContent = line.replace('||QUESTION||', '');
          el.style.animationDelay = (i * 0.15) + 's';
          dom.dialogueContent.appendChild(el);
        } else if (state.dialogueMode === 'feedback') {
          const el = document.createElement('div');
          el.className = 'feedback-text';
          el.textContent = line;
          el.style.animationDelay = (i * 0.15) + 's';
          dom.dialogueContent.appendChild(el);
        } else {
          const el = document.createElement('div');
          el.className = 'narration-text';
          el.textContent = line;
          el.style.animationDelay = (i * 0.15) + 's';
          dom.dialogueContent.appendChild(el);
        }
      });

      dom.dialogueContent.style.opacity = '1';
    }, 150);

    // 显示/隐藏分页提示
    const hasMore = state.currentPage < state.dialoguePages.length - 1;
    dom.pageHint.classList.toggle('visible', hasMore);
  }

  // === 对话框点击处理 ===
  function handleDialogueClick() {
    // 如果正在等待选择，忽略点击
    if (state.waitingForChoice) return;

    // 还有更多分页
    if (state.currentPage < state.dialoguePages.length - 1) {
      state.currentPage++;
      renderDialoguePage();
      return;
    }

    // 当前模式的所有分页展示完毕
    if (state.dialogueMode === 'narration') {
      // 剧情文字展示完毕，短暂延迟后显示选项
      setTimeout(() => showChoices(), 300);
    } else if (state.dialogueMode === 'feedback') {
      // 反馈展示完毕，短暂延迟后进入下一情节
      setTimeout(() => nextEpisode(), 400);
    }
  }

  // === 显示选项 ===
  function showChoices() {
    state.waitingForChoice = true;
    dom.pageHint.classList.remove('visible');

    const scene = SCENES_DATA[state.currentScene];
    const episode = scene.episodes[state.currentEpisode];
    const options = episode.options;

    dom.choicesArea.innerHTML = '';
    if (options.length === 5) {
      dom.choicesArea.classList.add('five-options');
    } else {
      dom.choicesArea.classList.remove('five-options');
    }

    options.forEach((opt, i) => {
      const bubble = document.createElement('div');
      bubble.className = 'choice-bubble';
      bubble.innerHTML = `<span class="label">${opt.label}.</span> ${opt.text}`;
      bubble.addEventListener('click', (e) => {
        e.stopPropagation();
        selectOption(i);
      });
      dom.choicesArea.appendChild(bubble);
    });

    dom.choicesArea.classList.add('visible');
  }

  // === 选择选项 ===
  function selectOption(index) {
    if (!state.waitingForChoice) return;
    state.waitingForChoice = false;

    const scene = SCENES_DATA[state.currentScene];
    const episode = scene.episodes[state.currentEpisode];
    const option = episode.options[index];

    // 累加分数
    state.totalScore += option.score;
    state.selectedOption = index;

    // 高亮选中选项
    const bubbles = dom.choicesArea.querySelectorAll('.choice-bubble');
    bubbles.forEach((b, i) => {
      if (i === index) b.classList.add('selected');
      b.style.pointerEvents = 'none';
    });

    // 隐藏选项，显示反馈
    setTimeout(() => {
      dom.choicesArea.classList.remove('visible');
      setTimeout(() => showFeedback(option), 400);
    }, 800);
  }

  // === 显示反馈 ===
  function showFeedback(option) {
    state.dialogueMode = 'feedback';
    state.dialoguePages = paginateText(option.feedback);
    state.currentPage = 0;
    renderDialoguePage();
  }

  // === 下一情节 ===
  function nextEpisode() {
    state.currentEpisode++;

    if (state.currentEpisode >= SCENES_DATA[state.currentScene].episodes.length) {
      // 当前场景结束，进入下一场景
      state.currentScene++;
      if (state.currentScene >= SCENES_DATA.length) {
        // 所有场景完成，显示结果
        showResult();
      } else {
        // 进入下一章
        showNextChapter();
      }
    } else {
      // 显示下一情节
      state.dialogueMode = 'narration';
      showEpisode(state.currentScene, state.currentEpisode);
    }
  }

  // === 进入下一章（场景间过渡） ===
  function showNextChapter() {
    state.phase = 'chapter';
    state.currentEpisode = 0; // 重置情节索引
    const scene = SCENES_DATA[state.currentScene];

    dom.chapterImg.src = scene.chapterImage;
    switchPage(dom.scenePage, dom.chapterPage, () => {
      setTimeout(() => {
        showTransition(state.currentScene);
      }, 2000);
    });
  }

  // === 显示结果 ===
  function showResult() {
    state.phase = 'result';
    const personality = getPersonality(state.totalScore);

    dom.resultContainer.innerHTML = buildResultHTML(personality);
    switchPage(dom.scenePage, dom.resultPage, () => {
      bindResultButtons();
    });
  }

  function buildResultHTML(p) {
    return `
      <div class="card-wrapper">
        <img class="card-image" src="${p.cardImage}" alt="${p.name}" />
      </div>
      <div class="result-name">${p.name}</div>
      <div class="result-subtitle">${p.subtitle}</div>
      <div class="result-score" style="color:${p.color}">优雅值：${p.finalScore}</div>
      <div class="result-quote">"${p.quote}"</div>
      <div class="result-traits">
        ${p.traits.map(t => `<span class="trait-tag">${t}</span>`).join('')}
      </div>
      <div class="result-description">${p.description}</div>
      <div class="result-buttons">
        <button class="btn-share" id="btn-share">生成分享海报</button>
        <button class="btn-retry" id="btn-retry">再测一次</button>
      </div>
    `;
  }

  function bindResultButtons() {
    document.getElementById('btn-share')?.addEventListener('click', generatePoster);
    document.getElementById('btn-retry')?.addEventListener('click', showEnding);
  }

  // === 生成分享海报 ===
  function generatePoster() {
    const personality = getPersonality(state.totalScore);
    const canvas = dom.posterCanvas;

    // 使用html2canvas生成
    if (typeof html2canvas === 'function') {
      // 先构建海报DOM
      canvas.innerHTML = buildPosterDOM(personality);
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.zIndex = '-1';

      html2canvas(canvas, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#F5E6D3',
        width: 375,
        height: 667
      }).then(c => {
        canvas.style.top = '-9999px';
        canvas.style.left = '-9999px';
        const imgData = c.toDataURL('image/jpeg', 0.92);
        dom.posterImage.src = imgData;
        dom.posterOverlay.classList.add('active');
      }).catch(() => {
        canvas.style.top = '-9999px';
        canvas.style.left = '-9999px';
        fallbackPoster(personality);
      });
    } else {
      fallbackPoster(personality);
    }
  }

  function buildPosterDOM(p) {
    return `
      <div style="width:375px;height:667px;background:#F5E6D3;display:flex;flex-direction:column;align-items:center;padding:30px 20px;font-family:'Noto Serif SC',serif;">
        <div style="font-size:12px;color:#8B7355;letter-spacing:3px;margin-bottom:12px;">中世纪人格鉴定</div>
        <img src="${p.cardImage}" style="width:180px;height:auto;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.2);margin-bottom:14px;" crossorigin="anonymous" />
        <div style="font-size:22px;font-weight:700;color:#2C1810;margin-bottom:4px;">${p.name}</div>
        <div style="font-size:12px;color:#8B7355;margin-bottom:8px;">${p.subtitle}</div>
        <div style="font-size:14px;color:${p.color};font-weight:600;margin-bottom:8px;">优雅值：${p.finalScore}</div>
        <div style="font-size:12px;color:#4A3728;font-style:italic;text-align:center;line-height:1.6;margin-bottom:10px;padding:0 10px;">"${p.quote}"</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:10px;">
          ${p.traits.map(t => `<span style="background:rgba(201,162,39,0.15);color:#8B6914;padding:3px 10px;border-radius:14px;font-size:11px;border:1px solid rgba(201,162,39,0.3);">${t}</span>`).join('')}
        </div>
        <div style="font-size:11px;color:#2C1810;line-height:1.6;text-align:center;padding:0 8px;">${p.description}</div>
      </div>
    `;
  }

  function fallbackPoster(p) {
    // 简单提示保存截图
    alert('请截图保存当前页面作为分享海报');
  }

  // === 尾页 ===
  function showEnding() {
    state.phase = 'ending';
    // 隐藏结果页，显示尾页
    dom.resultPage.classList.remove('active');
    dom.resultPage.style.display = 'none';

    const endingImg = document.createElement('img');
    endingImg.className = 'fullscreen-bg';
    endingImg.src = '../首页及过场页面等素材/尾页忠告.jpg';

    dom.endingPage.innerHTML = '';
    dom.endingPage.appendChild(endingImg);

    const hint = document.createElement('div');
    hint.className = 'ending-hint';
    hint.textContent = '点击屏幕任意位置返回首页';
    dom.endingPage.appendChild(hint);

    dom.endingPage.style.display = 'flex';
    dom.endingPage.classList.add('active', 'fade-in');
    setTimeout(() => dom.endingPage.classList.remove('fade-in'), 800);
  }

  // === 返回首页 ===
  function goHome() {
    state.phase = 'home';
    switchPage(dom.endingPage, null, () => {
      showHome();
    });
    // 直接显示首页
    dom.endingPage.classList.remove('active');
    dom.endingPage.style.display = 'none';
    dom.homePage.style.display = 'flex';
    dom.homePage.classList.add('active', 'fade-in');
    setTimeout(() => dom.homePage.classList.remove('fade-in'), 800);
  }

  // === 锁定竖屏 ===
  function lockPortrait() {
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('portrait-primary').catch(() => {});
    }
  }

  // === 启动 ===
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  lockPortrait();
})();
