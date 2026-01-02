# MTSDF Text Rendering Demo — Техническое задание

## Описание проекта

Демо-приложение на Next.js для демонстрации масштабируемого рендеринга текста с использованием MTSDF (Multi-channel True Signed Distance Field) и HarfBuzz для шейпинга.

## Цели проекта

- Продемонстрировать масштабируемый рендеринг текста на GPU с использованием MTSDF и HarfBuzz
- Обеспечить два режима визуализации: плоскость с текстом и куб с текстом
- Подготовить архитектуру, позволяющую расширять проект (новые режимы, дополнительные шрифты, динамический текст)
- Реализовать генерацию MTSDF-атласов по требованию с кэшированием

## Технологический стек

- **Frontend**: Next.js (app router), React, TypeScript (strict mode)
- **3D**: React Three Fiber, Three.js, @react-three/drei
- **Text Shaping**: HarfBuzz через `harfbuzz-modern-wrapper`
- **Atlas Generation**: msdf-atlas-gen (CLI tool)
- **Deployment**: Локальная разработка (Docker опционально, позже)

## Архитектура

### Принципы
- API-first подход: атласы генерируются по требованию через Next.js API routes
- Файловое кэширование: сгенерированные атласы сохраняются в `/public/generated/` (gitignore)
- Слоистая архитектура: разделение UI, 3D сцен, текстового пайплайна, шейдеров
- Расширяемость: легкое добавление новых шрифтов и режимов визуализации

### Структура проекта

```
/public/
  /fonts/                  # Исходные .ttf/.otf шрифты (коммитим в git)
    roboto.ttf
    open-sans.ttf
    ...
  /generated/              # Сгенерированные атласы (GITIGNORE!)
    /roboto/
      atlas.png            # 2048×2048 MTSDF texture
      atlas.json           # Метрика глифов

/app/
  /api/
    /atlas/route.ts        # GET /api/atlas?font=roboto
    /fonts/route.ts        # GET /api/fonts (список доступных шрифтов)
  page.tsx                 # Главная страница с UI и 3D сценой
  layout.tsx

/lib/
  /server/                 # Серверная логика (только Node.js)
    atlas-generator.ts     # Генерация через msdf-atlas-gen
    atlas-cache.ts         # Проверка/сохранение кэша
    fonts-config.ts        # Конфигурация шрифтов + charset
  /client/                 # Клиентская логика (браузер)
    /text/
      shaping.ts           # HarfBuzz интеграция
      quad-generator.ts    # Генерация quad-ов для рендеринга
      types.ts             # Типы для глифов, метрик
    /shaders/
      mtsdf-material.ts    # Кастомный MTSDF шейдер
  /components/
    /ui/
      font-selector.tsx    # Выбор шрифта
      mode-selector.tsx    # Выбор режима (Plane/Cube)
      font-size-slider.tsx # Slider для размера шрифта
    /scenes/
      plane-scene.tsx      # 3D сцена с плоскостью
      cube-scene.tsx       # 3D сцена с кубом
      text-mesh.tsx        # Компонент рендеринга текста

/scripts/
  setup-msdf.sh            # Инструкции по установке msdf-atlas-gen
  generate-common.js       # Скрипт для предгенерации базовых шрифтов (опционально)

/.gitignore
  /public/generated/       # Не коммитим сгенерированные атласы
```

## Функциональные требования

### 1. Генерация MTSDF-атласов

**Параметры атласа**:
- Размер текстуры: **2048×2048 px**
- Размер глифа: **48px**
- pxRange: **4** (стандарт для MSDF)
- Формат: PNG (RGBA) + JSON (метрика)

**Charset**:
```
ASCII 32-127 (printable characters):
 !"#$%&'()*+,-./0123456789:;<=>?@
ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`
abcdefghijklmnopqrstuvwxyz{|}~

Кириллица (русский):
АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя

Типографские символы:
–—«»""''…№©®™
```

**Итого**: ~190 символов

**Workflow генерации**:
1. Клиент запрашивает: `GET /api/atlas?font=roboto`
2. API проверяет кэш в `/public/generated/roboto/`
3. Если атлас существует → возвращает метаданные + URL
4. Если нет → генерирует через msdf-atlas-gen, сохраняет, возвращает
5. Клиент загружает PNG и JSON, рендерит текст

### 2. Список шрифтов (10 штук, все с кириллицей)

**Sans-serif**:
1. Roboto
2. Open Sans
3. Lato
4. Montserrat

**Serif**:
5. Merriweather
6. PT Serif
7. Playfair Display

**Monospace**:
8. JetBrains Mono
9. Fira Code
10. Roboto Mono

Все шрифты: Open Font License, поддержка кириллицы.

### 3. Шейпинг текста через HarfBuzz

- Использовать `harfbuzz-modern-wrapper` (WASM)
- Инициализация HarfBuzz при загрузке приложения
- Загрузка .ttf файлов для шейпинга
- Вход: строка текста + fontId
- Выход: массив глифов с позициями, индексами, advance

### 4. Формирование quad-ов

- На основе данных HarfBuzz (позиции глифов) и метрик атласа (UV координаты)
- Генерация BufferGeometry для Three.js
- Вычисление position, uv attributes
- Кэширование geometry (useMemo)

### 5. MTSDF шейдер

**Требования**:
- MSDF данные в RGB каналах, дополнительный SDF в A канале
- Поддержка порога и сглаживания (smoothstep)
- Fallback к A-каналу на малых размерах (< 10px)
- Корректная gamma-коррекция
- Настраиваемый цвет текста
- Использование `pxRange` из метрики атласа

**Реализация**: через `extend` + `shaderMaterial` из React Three Fiber

### 6. Режимы визуализации

**Режим "Plane" (плоскость)**:
- Одна плоскость в центре сцены с текстом
- OrbitControls для вращения и масштабирования
- Статическая позиция

**Режим "Cube" (куб)**:
- Текст на всех 6 гранях куба
- OrbitControls для взаимодействия
- Медленное авто-вращение (останавливается при взаимодействии)

**Общее**:
- Тёмный фон (например, #1a1a1a)
- Базовое освещение (AmbientLight + DirectionalLight)
- Без дополнительных эффектов

### 7. UI

**Элементы**:
- **Селектор шрифта**: плоский список из 10 шрифтов
- **Селектор режима**: Plane / Cube
- **Slider размера шрифта**: 4pt - 50pt, по умолчанию 20pt
- **Loading индикатор**: показывается при генерации атласа

**Стиль**: минималистичный, не отвлекающий от 3D сцены

### 8. Текст для отображения

Статический текст (Lorem ipsum), русский + английский:

```
Hello World! Привет, мир!

The quick brown fox jumps over the lazy dog.
Съешь же ещё этих мягких французских булок, да выпей чая.

Lorem ipsum dolor sit amet, consectetur adipiscing elit.
```

## Нефункциональные требования

- **TypeScript strict mode**: без `any`, строгая типизация
- **Производительность**: плавный рендеринг 60 FPS
- **Расширяемость**: легкое добавление новых шрифтов (добавить .ttf в `/public/fonts/`, обновить config)
- **Сборка**: стандартные команды `npm run dev`, `npm run build`, `npm start`
- **Документация**: README с инструкциями по установке msdf-atlas-gen

## Технические детали

### API `/api/atlas`

**Request**:
```
GET /api/atlas?font=roboto
```

**Response** (успех):
```json
{
  "font": "roboto",
  "atlasUrl": "/generated/roboto/atlas.png",
  "metadata": {
    "atlasSize": 2048,
    "pxRange": 4,
    "glyphs": [
      {
        "unicode": 65,
        "advance": { "x": 0.6, "y": 0 },
        "planeBounds": { "left": 0.05, "right": 0.55, "top": 0.7, "bottom": 0 },
        "atlasBounds": { "left": 100, "right": 148, "top": 50, "bottom": 98 }
      }
    ]
  }
}
```

**Response** (ошибка):
```json
{
  "error": "msdf-atlas-gen not found",
  "message": "Please install msdf-atlas-gen. See /scripts/setup-msdf.sh"
}
```

### API `/api/fonts`

**Request**:
```
GET /api/fonts
```

**Response**:
```json
{
  "fonts": [
    { "id": "roboto", "name": "Roboto", "category": "sans-serif" },
    { "id": "open-sans", "name": "Open Sans", "category": "sans-serif" },
    ...
  ]
}
```

### Конфигурация шрифтов

```typescript
// /lib/server/fonts-config.ts

export const CHARSET =
  ' !"#$%&\'()*+,-./0123456789:;<=>?@' +
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`' +
  'abcdefghijklmnopqrstuvwxyz{|}~' +
  'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя' +
  '–—«»""''…№©®™';

export const FONTS_CONFIG = [
  {
    id: 'roboto',
    name: 'Roboto',
    category: 'sans-serif',
    file: 'Roboto-Regular.ttf',
    atlasSize: 2048,
    glyphSize: 48,
    pxRange: 4,
  },
  // ... остальные 9 шрифтов
] as const;
```

### .gitignore

```gitignore
# Dependencies
node_modules/

# Next.js
.next/
out/

# Generated atlases (НЕ коммитим!)
/public/generated/

# Keep font files
!/public/fonts/*.ttf
!/public/fonts/*.otf
```

## Команды

```bash
# Установка зависимостей
npm install

# Локальная разработка
npm run dev

# Предгенерация базовых шрифтов (опционально, требует msdf-atlas-gen)
npm run generate-common

# Сборка
npm run build

# Запуск production
npm start
```

## Установка msdf-atlas-gen

См. `/scripts/setup-msdf.sh`:

```bash
# macOS
brew install msdf-atlas-gen  # (или скачать бинарник из GitHub releases)

# Linux
# Скачать предкомпилированный бинарник или собрать из исходников
# https://github.com/Chlumsky/msdf-atlas-gen/releases

# Windows
# Скачать .exe из releases
```

## План реализации

### Этап 1: Инициализация проекта
- [ ] Создать Next.js проект с TypeScript
- [ ] Настроить strict mode
- [ ] Установить зависимости (React Three Fiber, Drei, harfbuzz-modern-wrapper)
- [ ] Создать структуру папок
- [ ] Скачать 10 шрифтов в `/public/fonts/`

### Этап 2: Серверная часть
- [ ] Реализовать `fonts-config.ts` с CHARSET и списком шрифтов
- [ ] Реализовать `atlas-generator.ts` (запуск msdf-atlas-gen через child_process)
- [ ] Реализовать `atlas-cache.ts` (проверка/сохранение кэша)
- [ ] Реализовать API `/api/atlas`
- [ ] Реализовать API `/api/fonts`
- [ ] Создать скрипт `/scripts/setup-msdf.sh`

### Этап 3: Клиентская часть (текстовый пайплайн)
- [ ] Реализовать инициализацию HarfBuzz (`shaping.ts`)
- [ ] Реализовать функцию шейпинга текста
- [ ] Реализовать генератор quad-ов (`quad-generator.ts`)
- [ ] Определить типы для глифов, метрик (`types.ts`)

### Этап 4: MTSDF шейдер
- [ ] Реализовать vertex shader
- [ ] Реализовать fragment shader (MSDF + fallback на A-канал)
- [ ] Создать материал через `shaderMaterial` + `extend`
- [ ] Добавить uniforms (pxRange, color, threshold)

### Этап 5: UI компоненты
- [ ] Реализовать `font-selector.tsx`
- [ ] Реализовать `mode-selector.tsx`
- [ ] Реализовать `font-size-slider.tsx`
- [ ] Реализовать loading индикатор

### Этап 6: 3D сцены
- [ ] Реализовать `text-mesh.tsx` (компонент текста с MTSDF материалом)
- [ ] Реализовать `plane-scene.tsx` (плоскость + OrbitControls)
- [ ] Реализовать `cube-scene.tsx` (куб + авто-вращение + OrbitControls)
- [ ] Настроить освещение и камеру

### Этап 7: Главная страница
- [ ] Собрать UI + Canvas в `app/page.tsx`
- [ ] Управление состоянием (выбранный шрифт, режим, размер)
- [ ] Интеграция с API (загрузка атласов)
- [ ] Обработка loading state

### Этап 8: Тестирование и документация
- [ ] Проверить генерацию атласов
- [ ] Проверить оба режима визуализации
- [ ] Проверить все 10 шрифтов
- [ ] Проверить slider размера (4pt - 50pt)
- [ ] Написать README.md с инструкциями
- [ ] Проверить сборку (`npm run build`)

## Критерии успеха

- ✅ Демо запускается командой `npm run dev`
- ✅ Атласы генерируются автоматически при первом выборе шрифта
- ✅ Сгенерированные атласы кэшируются, повторная загрузка мгновенная
- ✅ Текст рендерится чётко на всех размерах (4pt - 50pt)
- ✅ Плавная работа OrbitControls в обоих режимах
- ✅ Авто-вращение куба останавливается при взаимодействии
- ✅ Все 10 шрифтов работают корректно
- ✅ Нет TypeScript ошибок (strict mode)
- ✅ Проект собирается через `npm run build`

## Примечания

- Docker опционально, можно добавить позже для deployment
- Для локальной разработки достаточно установки msdf-atlas-gen через инструкцию
- Атласы не коммитятся в git, генерируются локально
- В будущем можно расширить: больше шрифтов, кастомный текст, новые режимы визуализации, эффекты (outline, shadow)
