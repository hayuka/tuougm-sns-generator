"""Run against `npm run preview -- --port 4173` with Python Playwright + Chromium.
Optional environment: BASE_URL, CHROMIUM_PATH, SCREENSHOT_DIR.
No dependencies are added to the application.
"""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE_URL = os.environ.get('BASE_URL', 'http://localhost:4173').rstrip('/')
KEY = 'sns-generator:draft:v1:'

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    exceptions = []
    page.on('pageerror', lambda error: exceptions.append(str(error)))
    # Dismiss the native unsaved-changes prompt when a test intentionally leaves.
    page.on('dialog', lambda dialog: dialog.accept())

    def visit():
        page.goto(f'{BASE_URL}/create')
        expect(page.get_by_role('heading', name='投稿のアイデア')).to_be_visible()

    def select_brand(name):
        if page.viewport_size['width'] <= 900:
            page.get_by_role('button', name='ナビゲーションを開く').click()
            page.locator('dialog select').select_option(label=name)
            page.get_by_role('button', name='閉じる ×').click()
        else:
            page.locator('.desktop-sidebar select').select_option(label=name)

    def body():
        return page.locator('#post-body')

    def stored(brand='tuougm'):
        return page.evaluate('(key) => JSON.parse(localStorage.getItem(key))', KEY + brand)

    visit()
    expect(page.get_by_role('button', name='AIで投稿文を生成', exact=False)).to_be_disabled()
    page.get_by_role('button', name='下書き保存', exact=True).click()
    expect(page.get_by_role('alert')).to_contain_text('投稿テーマを入力してください')
    expect(page.get_by_role('alert')).to_contain_text('Instagramの投稿文を入力してください')
    assert stored() is None
    page.get_by_label('投稿テーマ', exact=False).fill('週末のプレイリスト')
    page.get_by_label('補足指示', exact=False).fill('やわらかいトーンで')
    page.get_by_role('button', name='投稿文を手動で作成', exact=False).click()
    expect(body()).to_be_focused()
    body().fill('Instagram専用の本文\n#音楽')
    expect(page.locator('.preview-body')).to_have_text('Instagram専用の本文\n#音楽')
    for platform in ['Threads', 'Facebook', 'X']:
        page.get_by_role('checkbox', name=platform, exact=True).check()
        expect(body()).to_have_value('')
        body().fill(f'{platform}専用の本文')
    page.get_by_role('tab', name='Instagram', exact=False).click()
    expect(body()).to_have_value('Instagram専用の本文\n#音楽')
    page.get_by_role('tab', name='Instagram', exact=False).press('ArrowRight')
    expect(page.get_by_role('tab', name='Threads', exact=False)).to_be_focused()
    expect(body()).to_have_value('Threads専用の本文')
    # Deselection never destroys platform text, including across save/reload.
    page.get_by_role('checkbox', name='Threads', exact=True).uncheck()
    page.get_by_role('button', name='下書き保存', exact=True).click()
    expect(page.locator('.save-state')).to_have_text('✓ 保存済み')
    first = stored()['draft']
    assert first['brandId'] == 'tuougm' and first['status'] == 'draft'
    assert first['id'] and first['createdAt'] and first['updatedAt']
    assert first['bodies']['threads'] == 'Threads専用の本文'
    assert len(set(first['bodies'].values())) == 4
    page.reload()
    page.get_by_role('checkbox', name='Threads', exact=True).check()
    expect(body()).to_have_value('Threads専用の本文')
    page.get_by_role('button', name='下書き保存', exact=True).click()
    expect(page.locator('.save-state')).to_have_text('✓ 保存済み')
    second = stored()['draft']
    assert first['id'] == second['id'] and first['createdAt'] == second['createdAt']
    assert second['updatedAt'] >= first['updatedAt']
    body().fill('TUOUGMの未保存テキスト')
    select_brand('RE:NA')
    expect(page.get_by_label('投稿テーマ', exact=False)).to_have_value('')
    expect(body()).to_have_value('')
    page.get_by_label('投稿テーマ', exact=False).fill('RE:NAのテーマ')
    body().fill('RE:NAの独立した本文')
    page.get_by_role('button', name='下書き保存', exact=True).click()
    re = stored('re')['draft']
    assert re['brandId'] == 're' and re['id'] != first['id']
    select_brand('TUOUGM')
    page.get_by_role('tab', name='Threads', exact=False).click()
    expect(body()).to_have_value('TUOUGMの未保存テキスト')
    expect(page.locator('.save-state')).to_contain_text('未保存の変更あり')
    page.locator('.desktop-sidebar a[href="/overview"]').click()
    page.locator('.desktop-sidebar a[href="/create"]').click()
    page.get_by_role('tab', name='Threads', exact=False).click()
    expect(body()).to_have_value('TUOUGMの未保存テキスト')
    # Quota/storage denial: do not report success or lose edits; allow retry.
    page.evaluate("() => { window.originalSetItem = Storage.prototype.setItem; Storage.prototype.setItem = function(){throw new DOMException('Quota exceeded', 'QuotaExceededError')}; }")
    page.get_by_role('button', name='下書き保存', exact=True).click()
    expect(page.get_by_role('alert')).to_contain_text('保存できませんでした。')
    expect(page.locator('.save-state')).to_contain_text('未保存の変更あり')
    expect(body()).to_have_value('TUOUGMの未保存テキスト')
    assert stored()['draft']['bodies']['threads'] == 'Threads専用の本文'
    page.evaluate('() => { Storage.prototype.setItem = window.originalSetItem; }')
    page.get_by_role('button', name='下書き保存', exact=True).click()
    expect(page.locator('.save-state')).to_have_text('✓ 保存済み')
    page.reload()
    page.get_by_role('tab', name='Threads', exact=False).click()
    expect(body()).to_have_value('TUOUGMの未保存テキスト')
    select_brand('RE:NA')
    expect(body()).to_have_value('RE:NAの独立した本文')
    for width in [320, 375, 768, 1024, 1440]:
        page.set_viewport_size({'width': width, 'height': 1000})
        for brand in ['TUOUGM', 'RE:NA']:
            select_brand(brand)
            page.get_by_role('button', name='投稿文を手動で作成', exact=False).click()
            body().fill('長いテキスト' * 100)
            page.get_by_role('button', name='下書き保存', exact=True).click()
            expect(page.locator('.save-state')).to_have_text('✓ 保存済み')
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (width, brand)
            rects = page.locator('.create-grid > section').evaluate_all('(els) => els.map(e => {const r=e.getBoundingClientRect(); return {x:r.x,y:r.y,bottom:r.bottom}})')
            if width <= 700:
                assert rects[1]['y'] >= rects[0]['bottom']
            else:
                assert rects[1]['x'] > rects[0]['x']
            if os.environ.get('SCREENSHOT_DIR'):
                directory = Path(os.environ['SCREENSHOT_DIR'])
                directory.mkdir(parents=True, exist_ok=True)
                page.screenshot(path=str(directory / f'create-{width}-{brand.replace(":", "")}.png'), full_page=True)
        print(f'PASS {width}px: layout, both brands, edit, save, no horizontal overflow')
    # Empty selection and whitespace validation; hidden text is retained.
    page.set_viewport_size({'width': 1440, 'height': 1000})
    select_brand('TUOUGM')
    for checkbox in page.get_by_role('checkbox').all():
        checkbox.uncheck()
    expect(page.get_by_role('heading', name='投稿先SNSを選択してください')).to_be_visible()
    expect(page.get_by_role('button', name='投稿文を手動で作成', exact=False)).to_be_disabled()
    page.get_by_role('button', name='下書き保存', exact=True).click()
    expect(page.get_by_role('alert')).to_contain_text('投稿先SNSを1つ以上選択してください')
    page.get_by_role('checkbox', name='Instagram', exact=True).check()
    body().fill('   ')
    page.get_by_label('投稿テーマ', exact=False).fill('   ')
    page.get_by_role('button', name='下書き保存', exact=True).click()
    expect(page.get_by_role('alert')).to_contain_text('Instagramの投稿文を入力してください')
    expect(page.get_by_role('alert')).to_contain_text('投稿テーマを入力してください')
    # Malformed JSON, invalid schema and foreign-brand data never overwrite storage.
    valid = stored()
    for raw in ['{invalid', json.dumps({'version': 99, 'draft': valid['draft']}), json.dumps({'version': 1, 'draft': re})]:
        page.evaluate('(args) => localStorage.setItem(args[0], args[1])', [KEY + 'tuougm', raw])
        page.reload()
        expect(page.get_by_role('alert')).to_contain_text('下書きを読み込めませんでした')
        expect(page.get_by_role('button', name='下書き保存', exact=True)).to_be_disabled()
        expect(body()).to_be_disabled()
        assert page.evaluate('(key) => localStorage.getItem(key)', KEY + 'tuougm') == raw
    page.evaluate('(args) => localStorage.setItem(args[0], JSON.stringify(args[1]))', [KEY + 'tuougm', valid])
    page.get_by_role('button', name='読み込みを再試行').click()
    expect(page.locator('.save-state')).to_have_text('✓ 保存済み')
    # localStorage read denial also produces an actionable error and retry.
    page.add_init_script("window.originalGetItem = Storage.prototype.getItem; Storage.prototype.getItem = function(){throw new DOMException('Storage denied', 'SecurityError')}")
    page.reload()
    expect(page.get_by_role('alert')).to_contain_text('下書きを読み込めませんでした')
    page.evaluate('() => { Storage.prototype.getItem = window.originalGetItem; }')
    page.get_by_role('button', name='読み込みを再試行').click()
    expect(page.locator('.save-state')).to_have_text('✓ 保存済み')
    assert not exceptions, exceptions
    print('PASS validation, independent SNS bodies, persistence, timestamps/IDs, brand isolation, unsaved navigation, storage failures/retry, corrupt data, no runtime exceptions')
    browser.close()
