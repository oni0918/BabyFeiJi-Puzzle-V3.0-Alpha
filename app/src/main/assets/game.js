const BOARD_SIZE = 8;

const ICONS = [
  "🐟",
  "🥛",
  "🧶",
  "🐾",
  "💎",
  "⭐"
];

const CHAPTERS = [
  {
    name: "城市公園",
    start: 1,
    end: 10,
    background: "linear-gradient(135deg, #3caf68, #83da99)",
    bossName: "黑狗隊長",
    bossFace: "🐶"
  },
  {
    name: "神秘森林",
    start: 11,
    end: 20,
    background: "linear-gradient(135deg, #176c3c, #49aa63)",
    bossName: "機械狗",
    bossFace: "🤖"
  },
  {
    name: "冰雪世界",
    start: 21,
    end: 30,
    background: "linear-gradient(135deg, #4ba5df, #c7edff)",
    bossName: "暗黑犬王",
    bossFace: "👹"
  },
  {
    name: "火山王國",
    start: 31,
    end: 40,
    background: "linear-gradient(135deg, #ad251c, #ff7b41)",
    bossName: "狗王",
    bossFace: "👑"
  },
  {
    name: "太空基地",
    start: 41,
    end: 50,
    background: "linear-gradient(135deg, #34277d, #925fe5)",
    bossName: "終極 Boss",
    bossFace: "☠️"
  }
];

const screens = document.querySelectorAll(".screen");

const gameBoard = document.getElementById("gameBoard");
const splashScreen = document.getElementById("splashScreen");
const homeScreen = document.getElementById("homeScreen");
const mapScreen = document.getElementById("mapScreen");
const gameScreen = document.getElementById("gameScreen");

const levelLabel = document.getElementById("levelLabel");
const scoreLabel = document.getElementById("scoreLabel");
const movesLabel = document.getElementById("movesLabel");

const chapterLabel = document.getElementById("chapterLabel");
const goalLabel = document.getElementById("goalLabel");
const goalProgress = document.getElementById("goalProgress");

const bossPanel = document.getElementById("bossPanel");
const bossFace = document.getElementById("bossFace");
const bossName = document.getElementById("bossName");
const bossHealth = document.getElementById("bossHealth");
const bossHealthText = document.getElementById("bossHealthText");

const comboText = document.getElementById("comboText");

const shuffleCountLabel = document.getElementById("shuffleCount");
const hammerCountLabel = document.getElementById("hammerCount");
const skillChargeLabel = document.getElementById("skillCharge");

const resultModal = document.getElementById("resultModal");
const resultIcon = document.getElementById("resultIcon");
const resultTitle = document.getElementById("resultTitle");
const resultText = document.getElementById("resultText");
const resultPrimaryButton = document.getElementById("resultPrimaryButton");

const toastElement = document.getElementById("toast");

let board = [];

let selectedTile = null;
let isBusy = false;
let hammerMode = false;

let currentLevel =
  Number(localStorage.getItem("babyfeiji_level")) || 1;

let score = 0;
let moves = 25;

let targetIcon = "🐟";
let targetAmount = 20;
let collectedAmount = 0;

let combo = 0;

let shuffleCount = 3;
let hammerCount = 3;
let skillCharge = 0;

let boss = null;

function showScreen(screenId) {
  screens.forEach((screen) => {
    screen.classList.remove("active");
  });

  document.getElementById(screenId).classList.add("active");
}

function getChapter(level) {
  return (
    CHAPTERS.find(
      (chapter) =>
        level >= chapter.start &&
        level <= chapter.end
    ) || CHAPTERS[CHAPTERS.length - 1]
  );
}

function getLevelConfig(level) {
  const chapter = getChapter(level);
  const isBossLevel = level % 10 === 0;

  const levelMoves = Math.max(
    18,
    28 - Math.floor(level / 4)
  );

  const levelTargetIcon =
    ICONS[(level - 1) % ICONS.length];

  const levelTargetAmount =
    15 + level * 2;

  let levelBoss = null;

  if (isBossLevel) {
    const maximumHealth = 140 + level * 10;

    levelBoss = {
      name: chapter.bossName,
      face: chapter.bossFace,
      health: maximumHealth,
      maximumHealth: maximumHealth
    };
  }

  return {
    chapter,
    moves: levelMoves,
    targetIcon: levelTargetIcon,
    targetAmount: levelTargetAmount,
    boss: levelBoss
  };
}

function startLevel(level) {
  currentLevel = Math.max(
    1,
    Math.min(50, level)
  );

  const config = getLevelConfig(currentLevel);

  score = 0;
  moves = config.moves;

  targetIcon = config.targetIcon;
  targetAmount = config.targetAmount;
  collectedAmount = 0;

  boss = config.boss;

  combo = 0;
  shuffleCount = 3;
  hammerCount = 3;
  skillCharge = 0;

  hammerMode = false;
  selectedTile = null;

  generateBoard();
  updateGameUI();
  showScreen("gameScreen");
}

function generateBoard() {
  board = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    board[row] = [];

    for (let column = 0; column < BOARD_SIZE; column++) {
      let icon;

      do {
        icon =
          ICONS[
            Math.floor(Math.random() * ICONS.length)
          ];
      } while (
        createsStartingMatch(
          row,
          column,
          icon
        )
      );

      board[row][column] = {
        icon: icon,
        special: null
      };
    }
  }

  renderBoard();
}

function createsStartingMatch(row, column, icon) {
  const horizontalMatch =
    column >= 2 &&
    board[row][column - 1]?.icon === icon &&
    board[row][column - 2]?.icon === icon;

  const verticalMatch =
    row >= 2 &&
    board[row - 1][column]?.icon === icon &&
    board[row - 2][column]?.icon === icon;

  return horizontalMatch || verticalMatch;
}

function renderBoard() {
  gameBoard.innerHTML = "";

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (
      let column = 0;
      column < BOARD_SIZE;
      column++
    ) {
      const cell = board[row][column];

      const tile = document.createElement("button");

      tile.className = "tile";
      tile.dataset.row = row;
      tile.dataset.column = column;

      if (cell.special === "rocket") {
        tile.classList.add("rocket");
      }

      if (cell.special === "rainbow") {
        tile.classList.add("rainbow");
      }

      if (cell.special !== "rainbow") {
        tile.textContent = cell.icon;
      }

      if (
        selectedTile &&
        selectedTile.row === row &&
        selectedTile.column === column
      ) {
        tile.classList.add("selected");
      }

      tile.addEventListener("click", () => {
        handleTileClick(row, column);
      });

      gameBoard.appendChild(tile);
    }
  }
}

async function handleTileClick(row, column) {
  if (isBusy) {
    return;
  }

  if (hammerMode) {
    await useHammer(row, column);
    return;
  }

  if (!selectedTile) {
    selectedTile = {
      row,
      column
    };

    renderBoard();
    return;
  }

  if (
    selectedTile.row === row &&
    selectedTile.column === column
  ) {
    selectedTile = null;
    renderBoard();
    return;
  }

  const distance =
    Math.abs(selectedTile.row - row) +
    Math.abs(selectedTile.column - column);

  if (distance !== 1) {
    selectedTile = {
      row,
      column
    };

    renderBoard();
    return;
  }

  const firstTile = {
    row: selectedTile.row,
    column: selectedTile.column
  };

  const secondTile = {
    row,
    column
  };

  selectedTile = null;

  await trySwap(firstTile, secondTile);
}

async function trySwap(firstTile, secondTile) {
  isBusy = true;

  swapTiles(firstTile, secondTile);
  renderBoard();

  await wait(140);

  const specialActivated =
    await activateSpecialSwap(
      firstTile,
      secondTile
    );

  const matchResult = findAllMatches();

  if (
    !specialActivated &&
    matchResult.cells.length === 0
  ) {
    swapTiles(firstTile, secondTile);
    renderBoard();

    showToast("這一步沒有形成消除");

    isBusy = false;
    return;
  }

  moves--;
  combo = 0;

  if (!specialActivated) {
    await processMatches(matchResult);
  }

  await resolveCascades();

  updateGameUI();
  checkGameResult();

  isBusy = false;
}

function swapTiles(firstTile, secondTile) {
  const firstCell =
    board[firstTile.row][firstTile.column];

  board[firstTile.row][firstTile.column] =
    board[secondTile.row][secondTile.column];

  board[secondTile.row][secondTile.column] =
    firstCell;
}

async function activateSpecialSwap(
  firstTile,
  secondTile
) {
  const firstCell =
    board[firstTile.row][firstTile.column];

  const secondCell =
    board[secondTile.row][secondTile.column];

  if (
    firstCell.special === "rainbow" ||
    secondCell.special === "rainbow"
  ) {
    const rainbowPosition =
      firstCell.special === "rainbow"
        ? firstTile
        : secondTile;

    const targetColor =
      firstCell.special === "rainbow"
        ? secondCell.icon
        : firstCell.icon;

    const cellsToRemove = [
      rainbowPosition
    ];

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (
        let column = 0;
        column < BOARD_SIZE;
        column++
      ) {
        if (
          board[row][column].icon ===
          targetColor
        ) {
          cellsToRemove.push({
            row,
            column
          });
        }
      }
    }

    await removeCells(
      cellsToRemove,
      true
    );

    await collapseAndRefill();

    return true;
  }

  if (
    firstCell.special === "rocket" ||
    secondCell.special === "rocket"
  ) {
    const cellsToRemove = [];

    if (firstCell.special === "rocket") {
      for (
        let column = 0;
        column < BOARD_SIZE;
        column++
      ) {
        cellsToRemove.push({
          row: firstTile.row,
          column
        });
      }
    }

    if (secondCell.special === "rocket") {
      for (
        let column = 0;
        column < BOARD_SIZE;
        column++
      ) {
        cellsToRemove.push({
          row: secondTile.row,
          column
        });
      }
    }

    await removeCells(
      cellsToRemove,
      true
    );

    await collapseAndRefill();

    return true;
  }

  return false;
}

function findAllMatches() {
  const matchedCells = new Map();
  const groups = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    let startColumn = 0;

    for (
      let column = 1;
      column <= BOARD_SIZE;
      column++
    ) {
      const sameIcon =
        column < BOARD_SIZE &&
        board[row][column].icon ===
          board[row][startColumn].icon &&
        board[row][column].special !==
          "rainbow";

      if (sameIcon) {
        continue;
      }

      const matchLength =
        column - startColumn;

      if (matchLength >= 3) {
        const group = [];

        for (
          let matchColumn = startColumn;
          matchColumn < column;
          matchColumn++
        ) {
          const cell = {
            row,
            column: matchColumn
          };

          matchedCells.set(
            `${row},${matchColumn}`,
            cell
          );

          group.push(cell);
        }

        groups.push(group);
      }

      startColumn = column;
    }
  }

  for (
    let column = 0;
    column < BOARD_SIZE;
    column++
  ) {
    let startRow = 0;

    for (
      let row = 1;
      row <= BOARD_SIZE;
      row++
    ) {
      const sameIcon =
        row < BOARD_SIZE &&
        board[row][column].icon ===
          board[startRow][column].icon &&
        board[row][column].special !==
          "rainbow";

      if (sameIcon) {
        continue;
      }

      const matchLength = row - startRow;

      if (matchLength >= 3) {
        const group = [];

        for (
          let matchRow = startRow;
          matchRow < row;
          matchRow++
        ) {
          const cell = {
            row: matchRow,
            column
          };

          matchedCells.set(
            `${matchRow},${column}`,
            cell
          );

          group.push(cell);
        }

        groups.push(group);
      }

      startRow = row;
    }
  }

  return {
    cells: Array.from(matchedCells.values()),
    groups
  };
}

async function processMatches(matchResult) {
  combo++;

  showCombo();

  const sortedGroups =
    [...matchResult.groups].sort(
      (firstGroup, secondGroup) =>
        secondGroup.length -
        firstGroup.length
    );

  const longestGroup = sortedGroups[0];

  let specialTile = null;

  if (
    longestGroup &&
    longestGroup.length >= 5
  ) {
    specialTile = {
      ...longestGroup[
        Math.floor(longestGroup.length / 2)
      ],
      type: "rainbow"
    };
  } else if (
    longestGroup &&
    longestGroup.length === 4
  ) {
    specialTile = {
      ...longestGroup[
        Math.floor(longestGroup.length / 2)
      ],
      type: "rocket"
    };
  }

  await removeCells(
    matchResult.cells,
    false,
    specialTile
  );

  await collapseAndRefill();
}

async function resolveCascades() {
  while (true) {
    const matchResult = findAllMatches();

    if (matchResult.cells.length === 0) {
      break;
    }

    await wait(120);
    await processMatches(matchResult);
  }
}

async function removeCells(
  cells,
  powerfulAttack = false,
  specialTile = null
) {
  const uniqueCells = Array.from(
    new Map(
      cells.map((cell) => [
        `${cell.row},${cell.column}`,
        cell
      ])
    ).values()
  );

  uniqueCells.forEach((cell) => {
    const tile = gameBoard.querySelector(
      `[data-row="${cell.row}"][data-column="${cell.column}"]`
    );

    if (tile) {
      tile.classList.add("removing");
    }
  });

  await wait(180);

  let bossDamage = 0;

  uniqueCells.forEach((cellPosition) => {
    const cell =
      board[cellPosition.row][
        cellPosition.column
      ];

    if (!cell) {
      return;
    }

    if (cell.icon === targetIcon) {
      collectedAmount++;
    }

    score += powerfulAttack
      ? 30
      : 10 * Math.max(combo, 1);

    skillCharge = Math.min(
      100,
      skillCharge + 3
    );

    bossDamage += powerfulAttack
      ? 6
      : 3 + combo;

    board[cellPosition.row][
      cellPosition.column
    ] = null;
  });

  if (boss) {
    boss.health = Math.max(
      0,
      boss.health - bossDamage
    );
  }

  if (specialTile) {
    board[specialTile.row][
      specialTile.column
    ] = {
      icon: targetIcon,
      special: specialTile.type
    };
  }

  vibratePhone(20);
  renderBoard();
  updateGameUI();
}

async function collapseAndRefill() {
  for (
    let column = 0;
    column < BOARD_SIZE;
    column++
  ) {
    const existingCells = [];

    for (
      let row = BOARD_SIZE - 1;
      row >= 0;
      row--
    ) {
      if (board[row][column]) {
        existingCells.push(
          board[row][column]
        );
      }
    }

    for (
      let row = BOARD_SIZE - 1,
        cellIndex = 0;
      row >= 0;
      row--,
        cellIndex++
    ) {
      board[row][column] =
        existingCells[cellIndex] || {
          icon:
            ICONS[
              Math.floor(
                Math.random() *
                  ICONS.length
              )
            ],
          special: null
        };
    }
  }

  renderBoard();
  await wait(180);
}

function updateGameUI() {
  const chapter =
    getChapter(currentLevel);

  levelLabel.textContent =
    currentLevel;

  scoreLabel.textContent = score;
  movesLabel.textContent = moves;

  chapterLabel.textContent =
    chapter.name;

  goalLabel.textContent =
    `收集 ${Math.min(
      collectedAmount,
      targetAmount
    )} / ${targetAmount} 個 ${targetIcon}`;

  const progressPercent =
    Math.min(
      100,
      (collectedAmount /
        targetAmount) *
        100
    );

  goalProgress.style.width =
    `${progressPercent}%`;

  shuffleCountLabel.textContent =
    shuffleCount;

  hammerCountLabel.textContent =
    hammerCount;

  skillChargeLabel.textContent =
    `${skillCharge}%`;

  if (boss) {
    bossPanel.classList.remove("hidden");

    bossFace.textContent = boss.face;
    bossName.textContent = boss.name;

    const healthPercent =
      (boss.health /
        boss.maximumHealth) *
      100;

    bossHealth.style.width =
      `${healthPercent}%`;

    bossHealthText.textContent =
      `${boss.health} / ${boss.maximumHealth}`;
  } else {
    bossPanel.classList.add("hidden");
  }
}

function checkGameResult() {
  const goalCompleted =
    collectedAmount >= targetAmount;

  const bossDefeated =
    !boss || boss.health <= 0;

  if (goalCompleted && bossDefeated) {
    const nextLevel = Math.min(
      50,
      currentLevel + 1
    );

    localStorage.setItem(
      "babyfeiji_level",
      String(nextLevel)
    );

    setTimeout(() => {
      showResultModal(true);
    }, 300);

    return;
  }

  if (moves <= 0) {
    setTimeout(() => {
      showResultModal(false);
    }, 300);
  }
}

function showResultModal(won) {
  resultModal.classList.remove("hidden");

  if (won) {
    resultIcon.textContent = "🎉";
    resultTitle.textContent =
      "過關成功！";

    resultText.textContent =
      `肥吉獲得 ${score} 分，已解鎖下一關！`;

    if (currentLevel >= 50) {
      resultPrimaryButton.textContent =
        "完成冒險";

      resultPrimaryButton.onclick = () => {
        resultModal.classList.add(
          "hidden"
        );

        showScreen("homeScreen");
      };
    } else {
      resultPrimaryButton.textContent =
        "下一關";

      resultPrimaryButton.onclick = () => {
        resultModal.classList.add(
          "hidden"
        );

        startLevel(currentLevel + 1);
      };
    }
  } else {
    resultIcon.textContent = "😿";
    resultTitle.textContent =
      "挑戰失敗";

    resultText.textContent =
      `還差 ${Math.max(
        0,
        targetAmount -
          collectedAmount
      )} 個 ${targetIcon}。`;

    resultPrimaryButton.textContent =
      "重新挑戰";

    resultPrimaryButton.onclick = () => {
      resultModal.classList.add(
        "hidden"
      );

      startLevel(currentLevel);
    };
  }
}

function buildWorldMap() {
  const unlockedLevel =
    Number(
      localStorage.getItem(
        "babyfeiji_level"
      )
    ) || 1;

  const worldMap =
    document.getElementById("worldMap");

  worldMap.innerHTML = "";

  CHAPTERS.forEach((chapter) => {
    const worldSection =
      document.createElement("section");

    worldSection.className =
      "world-section";

    worldSection.style.background =
      chapter.background;

    const worldTitle =
      document.createElement("h3");

    worldTitle.textContent =
      `${chapter.name}｜Boss：${chapter.bossName}`;

    const levelGrid =
      document.createElement("div");

    levelGrid.className = "level-grid";

    for (
      let level = chapter.start;
      level <= chapter.end;
      level++
    ) {
      const levelButton =
        document.createElement("button");

      levelButton.className =
        "level-button";

      levelButton.textContent = level;

      if (level > unlockedLevel) {
        levelButton.classList.add(
          "locked"
        );

        levelButton.disabled = true;
      }

      levelButton.addEventListener(
        "click",
        () => {
          startLevel(level);
        }
      );

      levelGrid.appendChild(
        levelButton
      );
    }

    worldSection.appendChild(
      worldTitle
    );

    worldSection.appendChild(
      levelGrid
    );

    worldMap.appendChild(
      worldSection
    );
  });
}

async function useHammer(row, column) {
  if (hammerCount <= 0) {
    showToast("鐵鎚已經用完了");
    return;
  }

  isBusy = true;

  hammerCount--;
  hammerMode = false;

  document
    .getElementById("hammerButton")
    .classList.remove("active");

  await removeCells(
    [{ row, column }],
    true
  );

  await collapseAndRefill();
  await resolveCascades();

  moves--;

  updateGameUI();
  checkGameResult();

  isBusy = false;
}

async function useFeijiSkill() {
  if (isBusy) {
    return;
  }

  if (skillCharge < 100) {
    showToast("肥吉能量還沒集滿");
    return;
  }

  isBusy = true;
  skillCharge = 0;

  const cellsToRemove = [];

  while (cellsToRemove.length < 18) {
    const randomCell = {
      row: Math.floor(
        Math.random() * BOARD_SIZE
      ),
      column: Math.floor(
        Math.random() * BOARD_SIZE
      )
    };

    const alreadyAdded =
      cellsToRemove.some(
        (cell) =>
          cell.row === randomCell.row &&
          cell.column ===
            randomCell.column
      );

    if (!alreadyAdded) {
      cellsToRemove.push(randomCell);
    }
  }

  showToast("🐱 肥吉火箭衝刺！");

  await removeCells(
    cellsToRemove,
    true
  );

  await collapseAndRefill();
  await resolveCascades();

  updateGameUI();
  checkGameResult();

  isBusy = false;
}

function shuffleBoard() {
  if (isBusy) {
    return;
  }

  if (shuffleCount <= 0) {
    showToast("洗牌次數已用完");
    return;
  }

  shuffleCount--;
  selectedTile = null;

  generateBoard();
  updateGameUI();

  showToast("棋盤已重新洗牌");
}

function toggleHammerMode() {
  if (hammerCount <= 0) {
    showToast("鐵鎚已經用完");
    return;
  }

  hammerMode = !hammerMode;

  document
    .getElementById("hammerButton")
    .classList.toggle(
      "active",
      hammerMode
    );

  showToast(
    hammerMode
      ? "請選擇一個方塊"
      : "已取消鐵鎚"
  );
}

function showCombo() {
  if (combo >= 2) {
    comboText.textContent =
      `${combo} COMBO！`;
  } else {
    comboText.textContent = "";
  }

  clearTimeout(showCombo.timeout);

  showCombo.timeout = setTimeout(
    () => {
      comboText.textContent = "";
    },
    800
  );
}

function showToast(message) {
  toastElement.textContent = message;
  toastElement.classList.add("show");

  clearTimeout(showToast.timeout);

  showToast.timeout = setTimeout(
    () => {
      toastElement.classList.remove(
        "show"
      );
    },
    1500
  );
}

function vibratePhone(milliseconds) {
  if (navigator.vibrate) {
    navigator.vibrate(milliseconds);
  }
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

document
  .getElementById("enterButton")
  .addEventListener("click", () => {
    showScreen("homeScreen");
  });

document
  .getElementById("startButton")
  .addEventListener("click", () => {
    startLevel(1);
  });

document
  .getElementById("continueButton")
  .addEventListener("click", () => {
    const savedLevel =
      Number(
        localStorage.getItem(
          "babyfeiji_level"
        )
      ) || 1;

    startLevel(savedLevel);
  });

document
  .getElementById("mapButton")
  .addEventListener("click", () => {
    buildWorldMap();
    showScreen("mapScreen");
  });

document
  .getElementById("mapBackButton")
  .addEventListener("click", () => {
    showScreen("homeScreen");
  });

document
  .getElementById("homeButton")
  .addEventListener("click", () => {
    showScreen("homeScreen");
  });

document
  .getElementById("dailyButton")
  .addEventListener("click", () => {
    const today =
      new Date().toDateString();

    const savedDate =
      localStorage.getItem(
        "babyfeiji_daily_reward"
      );

    if (savedDate === today) {
      showToast(
        "今天已經領過每日獎勵"
      );

      return;
    }

    localStorage.setItem(
      "babyfeiji_daily_reward",
      today
    );

    showToast(
      "每日獎勵領取成功！"
    );
  });

document
  .getElementById("shuffleButton")
  .addEventListener(
    "click",
    shuffleBoard
  );

document
  .getElementById("hammerButton")
  .addEventListener(
    "click",
    toggleHammerMode
  );

document
  .getElementById("skillButton")
  .addEventListener(
    "click",
    useFeijiSkill
  );

document
  .getElementById("resultHomeButton")
  .addEventListener("click", () => {
    resultModal.classList.add("hidden");
    showScreen("homeScreen");
  });

showScreen("splashScreen");
