"""Phase 3 end-to-end checks against a production preview; no app test dependencies.
Run: npm run build; npm run preview -- --port 4173; python3 tests/content_browser.py
"""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('BASE_URL', 'http://localhost:4173').rstrip('/')
V1 = 'sns-generator:draft:v1:tuougm'
V2 = 'sns-generator:drafts:v2:tuougm'

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    exceptions = []
    page.on('pageerror', lambda error: exceptions.append(str(error)))
    page.on('dialog', lambda dialog: dialog.accept())

    def visit(path='/content'):
        page.goto(BASE + path)

    def brand(name):
        if page.viewport_size['width'] <= 900:
            page.get_by_role('button', name='ナビゲーションを開く').click()
            page.locator('dialog select').select_option(label=name)
            page.get_by_role('button', name='閉じる ×').click()
        else:
            page.locator('.desktop-sidebar select').select_option(label=name)

    def stored(key=V2):
        return page.evaluate('(key) => JSON.parse(localStorage.getItem(key))', key)

    def save():
        page.get_by_role('button', name='下書き保存', exact=True).click()
        expect(page.locator('.save-state')).to_have_text('✓ 保存済み')
        assert '?draft=' in page.url

    def row(theme):
        return page.locator('.content-row').filter(has=page.get_by_role('heading', name=theme, exact=True))

    def back():
        page.get_by_role('link', name='← 投稿一覧へ戻る').click()

    visit()
    expect(page.get_by_role('heading', name='まだ投稿がありません')).to_be_visible()
    page.get_by_role('link', name='＋ 新規投稿', exact=True).click()
    page.get_by_role('button', name='下書き保存', exact=True).click()
    expect(page.get_by_role('alert')).to_contain_text('投稿テーマを入力してください')
    page.locator('#post-theme').fill('   ')
    page.get_by_role('button', name='下書き保存', exact=True).click()
    expect(page.get_by_role('alert')).to_contain_text('投稿テーマを入力してください')
    page.locator('#post-theme').fill('テーマだけのアイデア')
    page.get_by_role('checkbox', name='Instagram', exact=True).uncheck()
    save()
    first = stored()['posts'][0]
    assert first['platforms'] == [] and first['revision'] == 1
    first_id, created = first['id'], first['createdAt']
    assert all(not value for value in first['bodies'].values())
    back()
    expect(row('テーマだけのアイデア')).to_contain_text('SNS未選択')
    expect(row('テーマだけのアイデア')).to_contain_text('本文はまだ入力されていません')
    page.get_by_role('link', name='＋ 新規投稿', exact=True).click()
    expect(page.locator('#post-theme')).to_have_value('')
    page.locator('#post-theme').fill('SNS別の投稿')
    page.locator('#post-body').fill('Instagramだけの本文')
    page.get_by_role('checkbox', name='Threads', exact=True).check()
    page.locator('#post-body').fill('Threadsだけの本文')
    save()
    second_id = page.url.split('draft=')[1]
    assert second_id != first_id and len(stored()['posts']) == 2
    back()
    expect(page.locator('.content-row').first).to_contain_text('SNS別の投稿')
    page.get_by_label('SNS媒体', exact=True).select_option('threads')
    expect(page.locator('.content-row')).to_have_count(1)
    expect(page.locator('.content-excerpt')).to_have_text('Threadsだけの本文')
    page.get_by_label('SNS媒体', exact=True).select_option('x')
    expect(page.get_by_role('heading', name='該当する投稿はありません')).to_be_visible()
    page.get_by_role('button', name='絞り込みを解除').click()
    expect(page.locator('.content-row')).to_have_count(2)
    row('テーマだけのアイデア').get_by_role('link', name='テーマだけのアイデアを編集').click()
    page.locator('#post-theme').fill('Aの未保存')
    back()
    expect(row('テーマだけのアイデア')).to_contain_text('未保存の変更あり')
    row('SNS別の投稿').get_by_role('link', name='SNS別の投稿を編集').click()
    expect(page.locator('#post-theme')).to_have_value('SNS別の投稿')
    page.locator('#post-theme').fill('Bの未保存')
    brand('RE:NA')
    expect(page.get_by_role('alert')).to_contain_text('別のブランド')
    brand('TUOUGM')
    expect(page.locator('#post-theme')).to_have_value('Bの未保存')
    back()
    row('テーマだけのアイデア').get_by_role('link', name='テーマだけのアイデアを編集').click()
    expect(page.locator('#post-theme')).to_have_value('Aの未保存')
    save()
    saved = next(post for post in stored()['posts'] if post['id'] == first_id)
    assert saved['createdAt'] == created and saved['revision'] == 2
    assert saved['theme'] == 'Aの未保存'
    back()
    page.get_by_role('link', name='＋ 新規投稿', exact=True).click()
    page.locator('#post-theme').fill('作成中の新規')
    back()
    expect(page.get_by_role('link', name='作業を再開')).to_be_visible()
    page.get_by_role('link', name='＋ 新規投稿', exact=True).click()
    expect(page.locator('#post-theme')).to_have_value('作成中の新規')
    page.get_by_role('button', name='破棄して新規作成').click()
    expect(page.get_by_role('button', name='キャンセル', exact=True)).to_be_focused()
    page.keyboard.press('Escape')
    expect(page.locator('#post-theme')).to_have_value('作成中の新規')
    page.get_by_role('button', name='破棄して新規作成').click()
    page.get_by_role('button', name='破棄して続ける').click()
    expect(page.locator('#post-theme')).to_have_value('')
    brand('RE:NA')
    page.locator('#post-theme').fill('RE:NA専用')
    save()
    back()
    expect(page.locator('.content-row')).to_have_count(1)
    expect(page.locator('.content-row')).to_contain_text('RE:NA専用')
    brand('TUOUGM')
    expect(page.locator('.content-row')).to_have_count(2)
    # Delete cancellation and failed deletion never remove stored data or cached edits.
    target = row('SNS別の投稿')
    target.get_by_text('その他', exact=False).click()
    target.get_by_role('button', name='削除', exact=True).click()
    expect(page.get_by_role('dialog')).to_contain_text('SNS別の投稿')
    expect(page.get_by_role('button', name='キャンセル', exact=True)).to_be_focused()
    page.get_by_role('button', name='キャンセル', exact=True).click()
    expect(page.locator('.content-row')).to_have_count(2)
    before = page.evaluate('(key)=>localStorage.getItem(key)', V2)
    page.evaluate("window.originalSet=Storage.prototype.setItem; Storage.prototype.setItem=function(){throw new DOMException('Quota','QuotaExceededError')}")
    target.get_by_text('その他', exact=False).click()
    target.get_by_role('button', name='削除', exact=True).click()
    page.get_by_role('button', name='削除する', exact=True).click()
    expect(page.get_by_role('alert')).to_contain_text('削除できませんでした')
    assert page.evaluate('(key)=>localStorage.getItem(key)', V2) == before
    expect(page.locator('.content-row')).to_have_count(2)
    page.evaluate('Storage.prototype.setItem=window.originalSet')
    target.get_by_text('その他', exact=False).click()
    target.get_by_role('button', name='削除', exact=True).click()
    page.get_by_role('button', name='削除する', exact=True).click()
    expect(page.locator('.content-row')).to_have_count(1)
    visit('/create?draft=' + second_id)
    expect(page.get_by_role('alert')).to_contain_text('存在しない')
    expect(page.locator('#post-theme')).to_have_count(0)
    # Saving stale work is stopped, including a post deleted elsewhere.
    visit('/create?draft=' + first_id)
    page.locator('#post-theme').fill('競合する入力')
    page.evaluate("key=>{const e=JSON.parse(localStorage.getItem(key));e.posts[0].revision++;e.posts[0].theme='別タブの更新';localStorage.setItem(key,JSON.stringify(e))}", V2)
    page.get_by_role('button', name='下書き保存', exact=True).click()
    expect(page.get_by_role('alert')).to_contain_text('上書きを停止')
    expect(page.locator('#post-theme')).to_have_value('競合する入力')
    assert stored()['posts'][0]['theme'] == '別タブの更新'
    page.get_by_role('button', name='保存データを再読み込み').click()
    page.get_by_role('button', name='破棄して続ける').click()
    expect(page.locator('#post-theme')).to_have_value('別タブの更新')
    page.locator('#post-theme').fill('容量不足で保持する入力')
    page.evaluate("window.originalSet=Storage.prototype.setItem; Storage.prototype.setItem=function(){throw new DOMException('Quota','QuotaExceededError')}")
    page.get_by_role('button', name='下書き保存', exact=True).click()
    expect(page.get_by_role('alert')).to_contain_text('保存できませんでした')
    expect(page.locator('#post-theme')).to_have_value('容量不足で保持する入力')
    page.evaluate('Storage.prototype.setItem=window.originalSet')
    save()
    # Reload and direct routes retain saved IDs; malformed and foreign IDs show errors.
    page.reload()
    expect(page.locator('#post-theme')).to_have_value('容量不足で保持する入力')
    for path in ['/create?draft=missing', '/create?draft=', '/create?draft=a&draft=b']:
        visit(path)
        expect(page.locator('#post-theme')).to_have_count(0)
    visit('/content')
    # Responsive layout, both brands, modal keyboard focus and overflow on long content.
    visit('/create?draft=' + first_id)
    page.locator('#post-theme').fill('https://example.com/' + 'long' * 100)
    page.get_by_role('checkbox', name='Instagram', exact=True).check()
    page.locator('#post-body').fill('https://example.com/' + 'body' * 300)
    save()
    back()
    for width in [320, 375, 768, 1024, 1440]:
        page.set_viewport_size({'width': width, 'height': 1000})
        for name in ['TUOUGM', 'RE:NA']:
            brand(name)
            expect(page.locator('.content-row')).to_have_count(1)
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (width, name)
            assert page.locator('.content-actions a').is_visible()
            if os.environ.get('SCREENSHOT_DIR'):
                directory = Path(os.environ['SCREENSHOT_DIR']); directory.mkdir(parents=True, exist_ok=True)
                page.screenshot(path=str(directory / f'content-{width}-{name.replace(":", "")}.png'), full_page=True)
        print(f'PASS {width}px: both brands, visible edit, no horizontal overflow')
    # v1 migration preserves all original fields, repeated loads do not duplicate, deletion never reimports.
    page.set_viewport_size({'width': 1440, 'height': 1000})
    legacy_draft = {'id':'legacy-1','brandId':'tuougm','status':'draft','createdAt':'2026-01-01T00:00:00Z','updatedAt':'2026-01-02T00:00:00Z','theme':'移行する投稿','instructions':'保持する補足','platforms':['instagram'],'bodies':{'instagram':'移行する本文','threads':'非選択の本文','facebook':'','x':''}}
    raw = json.dumps({'version':1,'draft':legacy_draft}, ensure_ascii=False)
    page.evaluate('(args)=>{localStorage.clear();localStorage.setItem(args[0],args[1])}', [V1, raw])
    visit()
    expect(page.locator('.content-row')).to_have_count(1)
    migrated = stored()['posts'][0]
    assert {k:v for k,v in migrated.items() if k != 'revision'} == legacy_draft
    assert page.evaluate('(key)=>localStorage.getItem(key)', V1) == raw
    page.reload()
    expect(page.locator('.content-row')).to_have_count(1)
    page.get_by_text('その他', exact=False).click()
    page.get_by_role('button', name='削除', exact=True).click()
    page.get_by_role('button', name='削除する').click()
    page.reload()
    expect(page.get_by_role('heading', name='まだ投稿がありません')).to_be_visible()
    assert page.evaluate('(key)=>localStorage.getItem(key)', V1) == raw
    # Read errors and corrupt data never appear as an empty successful list.
    for key, bad in [(V2, '{bad'), (V2, json.dumps({'version':99})), (V1, '{bad')]:
        page.evaluate('(args)=>{localStorage.clear();localStorage.setItem(args[0],args[1])}', [key,bad])
        visit()
        expect(page.get_by_role('alert')).to_contain_text('読み込めませんでした')
        assert page.evaluate('(key)=>localStorage.getItem(key)', key) == bad
        page.get_by_role('link', name='＋ 新規投稿', exact=True).click()
        expect(page.get_by_role('alert')).to_contain_text('読み込めませんでした')
        expect(page.locator('#post-theme')).to_have_count(0)
    page.evaluate('localStorage.clear()')
    page.reload()
    expect(page.locator('#post-theme')).to_be_visible()
    page.evaluate("window.originalGet=Storage.prototype.getItem; Storage.prototype.getItem=function(){throw new DOMException('Denied','SecurityError')}")
    back()
    expect(page.get_by_role('alert')).to_contain_text('読み込めませんでした')
    page.evaluate('Storage.prototype.getItem=window.originalGet')
    page.get_by_role('button', name='読み込みを再試行').click()
    expect(page.get_by_role('heading', name='まだ投稿がありません')).to_be_visible()
    assert not exceptions, exceptions
    print('PASS create/edit/delete, filters, IDs, revisions, theme-only saving, migration, failures, unsaved work, brand isolation, keyboard, no runtime exceptions')
    browser.close()
