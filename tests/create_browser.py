"""Create regression checks for Phase 3. Run against npm run preview -- --port 4173.
Optional: BASE_URL, CHROMIUM_PATH, SCREENSHOT_DIR. Uses Python Playwright.
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE_URL = os.environ.get('BASE_URL', 'http://localhost:4173').rstrip('/')
KEY = 'sns-generator:drafts:v2:'
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), args=['--no-sandbox'])
    page = browser.new_page(viewport={'width':1440,'height':1000})
    exceptions = []
    page.on('pageerror', lambda error: exceptions.append(str(error)))
    page.on('dialog', lambda dialog: dialog.accept())
    def select_brand(name):
        if page.viewport_size['width'] <= 900:
            page.get_by_role('button', name='ナビゲーションを開く').click()
            page.locator('dialog select').select_option(label=name)
            page.get_by_role('button', name='閉じる ×').click()
        else:
            page.locator('.desktop-sidebar select').select_option(label=name)
    def saved(brand='tuougm'):
        return page.evaluate('key=>JSON.parse(localStorage.getItem(key)).posts', KEY+brand)
    page.goto(BASE_URL+'/create')
    expect(page.get_by_role('button', name='AIで投稿文を生成', exact=False)).to_be_disabled()
    page.locator('#post-theme').fill('週末のプレイリスト')
    page.locator('#post-instructions').fill('やわらかいトーンで')
    page.get_by_role('button', name='投稿文を手動で作成', exact=False).click()
    expect(page.locator('#post-body')).to_be_focused()
    page.locator('#post-body').fill('Instagram専用の本文\n#音楽')
    expect(page.locator('.preview-body')).to_have_text('Instagram専用の本文\n#音楽')
    for platform in ['Threads','Facebook','X']:
        page.get_by_role('checkbox', name=platform, exact=True).check()
        expect(page.locator('#post-body')).to_have_value('')
        page.locator('#post-body').fill(platform+'専用の本文')
    page.get_by_role('tab', name='Instagram', exact=False).click()
    expect(page.locator('#post-body')).to_have_value('Instagram専用の本文\n#音楽')
    page.get_by_role('tab', name='Instagram', exact=False).press('ArrowRight')
    expect(page.get_by_role('tab', name='Threads', exact=False)).to_be_focused()
    page.get_by_role('checkbox', name='Threads', exact=True).uncheck()
    page.get_by_role('button', name='下書き保存', exact=True).click()
    expect(page.locator('.save-state')).to_have_text('✓ 保存済み')
    first=saved()[0]
    assert first['bodies']['threads']=='Threads専用の本文'
    assert len(set(first['bodies'].values()))==4
    edit_url=page.url
    page.reload()
    page.get_by_role('checkbox', name='Threads', exact=True).check()
    expect(page.locator('#post-body')).to_have_value('Threads専用の本文')
    page.get_by_role('button', name='下書き保存', exact=True).click()
    expect(page.locator('.save-state')).to_have_text('✓ 保存済み')
    second=saved()[0]
    assert second['id']==first['id'] and second['createdAt']==first['createdAt']
    assert second['revision']==first['revision']+1
    page.locator('#post-body').fill('未保存の本文')
    page.locator('.desktop-sidebar a[href="/overview"]').click()
    page.get_by_role('link', name='投稿一覧を見る').click()
    page.locator('.content-actions a').click()
    page.get_by_role('tab', name='Threads', exact=False).click()
    expect(page.locator('#post-body')).to_have_value('未保存の本文')
    # Keep a separate new scratch per brand, without reusing a saved post ID.
    page.locator('.desktop-sidebar a[href="/create"]').click()
    page.locator('#post-theme').fill('TUOUGMの新規作業')
    select_brand('RE:NA')
    expect(page.locator('#post-theme')).to_have_value('')
    page.locator('#post-theme').fill('RE:NAの新規作業')
    select_brand('TUOUGM')
    expect(page.locator('#post-theme')).to_have_value('TUOUGMの新規作業')
    # Save both brands, using each saved route independently at all target widths.
    page.get_by_role('button', name='下書き保存', exact=True).click()
    expect(page.locator('.save-state')).to_have_text('✓ 保存済み')
    tuougm_url=page.url
    page.locator('.desktop-sidebar a[href="/create"]').click()
    select_brand('RE:NA')
    expect(page.locator('#post-theme')).to_have_value('RE:NAの新規作業')
    page.get_by_role('button', name='下書き保存', exact=True).click()
    expect(page.locator('.save-state')).to_have_text('✓ 保存済み')
    re_url=page.url
    assert saved('re')[0]['brandId']=='re'
    for width in [320,375,768,1024,1440]:
        page.set_viewport_size({'width':width,'height':1000})
        for brand,url in [('TUOUGM',tuougm_url),('RE:NA',re_url)]:
            page.goto(url)
            select_brand(brand)
            expect(page.locator('#post-theme')).to_be_visible()
            page.get_by_role('button', name='投稿文を手動で作成', exact=False).click()
            expect(page.locator('#post-body')).to_be_focused()
            page.locator('#post-body').fill('長いテキスト'*100)
            page.get_by_role('button', name='下書き保存', exact=True).click()
            expect(page.locator('.save-state')).to_have_text('✓ 保存済み')
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),(width,brand)
            rects=page.locator('.create-grid > section').evaluate_all('(els)=>els.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,bottom:r.bottom}})')
            assert rects[1]['y']>=rects[0]['bottom'] if width<=700 else rects[1]['x']>rects[0]['x']
            if os.environ.get('SCREENSHOT_DIR'):
                directory=Path(os.environ['SCREENSHOT_DIR']);directory.mkdir(parents=True,exist_ok=True)
                page.screenshot(path=str(directory/f'create-{width}-{brand.replace(":", "")}.png'),full_page=True)
        print(f'PASS Create regression {width}px: both brands, layout, SNS editing, save, no horizontal overflow')
    assert not exceptions,exceptions
    browser.close()
