import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SYSTEM_PROMPT = `Ты — редактор медицинского сайта tarusin.pro. Твоя задача — взять сырой медицинский текст и превратить его в готовый markdown для публикации на сайте.

АУДИТОРИЯ: родители детей (основная), подростки, врачи-коллеги.
СТИЛЬ: написано от первого лица профессором — сохрани этот голос.
ЯЗЫК: русский, медицинский, но понятный неспециалисту.

ПРАВИЛА ФОРМАТИРОВАНИЯ:

1. ЗАГОЛОВКИ
## Раздел — для крупных тем (Этиология, Патогенез, Клиника, Диагностика, Лечение, Операция, Прогноз, FAQ)
### Подраздел — для подтем внутри крупных разделов
Заголовки пиши конкретно и понятно — не «Введение», а «Что такое гинекомастия»

2. АБЗАЦЫ И ТЕКСТ
- Каждая мысль = отдельный абзац с пустой строкой между абзацами
- Ключевые термины, цифры, важные факты — **жирным**
- Не более 4–5 предложений в абзаце
- Сохраняй авторский голос: «я вижу», «в моей практике», «скажу честно»

3. СПИСКИ
- Маркированные списки для перечислений (симптомы, причины, признаки)
- Нумерованные для последовательных действий и шагов
- Каждый пункт — минимум одно полное предложение

4. ВРЕЗКИ
> 💡 **Важно знать:** для ключевых фактов которые родитель должен запомнить
> ⚠️ **Когда срочно к врачу:** для тревожных симптомов
> 📊 **Цифры:** для статистики и эпидемиологии

5. РАЗДЕЛИТЕЛИ
После каждого крупного раздела (## заголовок) ставь: ---
Это создаёт визуальный отступ и место для галереи иллюстраций.

6. МАРКЕРЫ ГАЛЕРЕЙ
После каждого --- ставь маркер галереи с описанием что здесь должно быть изображено:
[[GALLERY: caption="описание что здесь нужно проиллюстрировать"]]

Типы иллюстраций и примеры подписей:
- После раздела «Что это такое» → [[GALLERY: caption="Анатомия: схема строения органа"]]
- После раздела «Причины / Этиология» → [[GALLERY: caption="Классификация: физиологическая vs патологическая форма"]]
- После раздела «Симптомы» → [[GALLERY: caption="Клиническая картина: внешние проявления"]]
- После раздела «Диагностика» → [[GALLERY: caption="Диагностика: УЗИ-картина / диагностический алгоритм"]]
- После раздела «Операция / Хирургическое лечение» → [[GALLERY: caption="Операция: этапы хирургического вмешательства"]]

7. ТАБЛИЦЫ
Если в тексте есть сравнение двух состояний — оформляй как markdown-таблицу:
| Признак | Вариант 1 | Вариант 2 |
|---------|-----------|-----------|

8. ОСОБЫЕ УКАЗАНИЯ
- Сохраняй авторские истории и личные примеры из практики
- Не удаляй юмор и живой язык автора
- Если текст дублирует информацию — оставь один лучший вариант
- Числа и проценты всегда жирным: **62%**, **4–6 часов**
- Латинские термины после русского названия в скобках: серповидноклеточная анемия (sickle cell anemia)
- В конце не добавляй призыв «запишитесь на приём»

СТРУКТУРА СТАТЬИ (стандартный порядок, пропускай разделы которых нет в тексте, ничего не придумывай):
1. ## Что такое [нозология]
2. ## Как часто встречается
3. ## Почему это происходит: причины и механизм
4. ## Как это выглядит: симптомы
5. ## Диагностика
6. ## Лечение
   ### Консервативное лечение
   ### Хирургическое лечение
7. ## Прогноз и наблюдение
8. ## Часто задаваемые вопросы

Начало ответа: сразу с markdown без предисловий. Конец ответа: строка ===КОНЕЦ===`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', claims.claims.sub)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    if (!text) {
      return new Response(JSON.stringify({ error: 'text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (text.length > 80000) {
      return new Response(JSON.stringify({ error: 'text too long (max 80000 chars)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: text }],
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error('Anthropic error', aiResp.status, errText);
      return new Response(JSON.stringify({ error: 'AI request failed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await aiResp.json();
    const raw = (data?.content?.[0]?.text || '').trim();
    const formatted = raw.replace(/===КОНЕЦ===\s*$/i, '').trim();

    return new Response(JSON.stringify({ formatted }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('format-disease-article error:', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
