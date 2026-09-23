import { test, expect } from '@playwright/test'

test.describe('Fluxo Crítico do Restaurante - Painel Administrativo', () => {
  const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'qa-e2e-teste@cardapioqr.com'
  const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'QaPassword@123456'
  const ITEM_NAME = `Burger QA Especial ${Date.now().toString().slice(-4)}`

  test('Deve realizar login, acessar o gerenciamento de itens, cadastrar um novo produto e confirmar mensagem de sucesso', async ({ page }) => {
    // 1. Acesso à página de autenticação
    console.log('1. Acessando tela de login (/auth/login)...')
    await page.goto('/auth/login')
    await expect(page).toHaveTitle(/CardápioQR|Entrar/i)

    // 2. Preenchimento das credenciais de acesso
    console.log('2. Preenchendo credenciais do usuário...')
    await page.fill('input#email', TEST_EMAIL)
    await page.fill('input#password', TEST_PASSWORD)
    await page.click('button[type="submit"]')

    // 3. Validação do redirecionamento pós-login para a área administrativa
    console.log('3. Aguardando autenticação e redirecionamento para o painel...')
    await page.waitForURL(url => url.pathname.includes('/admin'), { timeout: 15000 })
    expect(page.url()).toContain('/admin')

    // 4. Navegação para a gestão de itens do cardápio
    console.log('4. Acessando a página de gestão de itens (/admin/items)...')
    await page.goto('/admin/items')
    await expect(page.locator('h1')).toContainText('Itens do Cardápio')

    // 5. Abertura do formulário de novo produto
    console.log('5. Clicando no botão para adicionar novo item...')
    const novoItemButton = page.locator('button:has-text("Novo item"), button:has-text("Adicionar item")').first()
    await novoItemButton.waitFor({ state: 'visible' })
    await novoItemButton.click()

    // 6. Preenchimento dos dados do produto no modal
    console.log('6. Preenchendo dados do novo produto...')
    const modalHeader = page.locator('h2:has-text("Novo item")')
    await expect(modalHeader).toBeVisible()

    await page.fill('input#item-name', ITEM_NAME)
    await page.fill('input#item-price', '38,50')
    await page.fill('textarea#item-description', 'Delicioso hambúrguer artesanal cadastrado via automação Playwright E2E.')

    // Seleciona a primeira categoria disponível no dropdown
    const categorySelect = page.locator('select#item-category')
    const categoryOptions = await categorySelect.locator('option').all()
    if (categoryOptions.length > 1) {
      const firstValidValue = await categoryOptions[1].getAttribute('value')
      if (firstValidValue) {
        await categorySelect.selectOption(firstValidValue)
      }
    }

    // 7. Envio do formulário e criação do item
    console.log('7. Submetendo formulário do produto...')
    const submitButton = page.locator('button[type="submit"]:has-text("Criar item"), button[type="submit"]:has-text("Salvar")').first()
    await submitButton.click()

    // 8. Validação da mensagem de sucesso (Toast)
    console.log('8. Verificando exibição da notificação de sucesso...')
    const successToast = page.getByText(/Item criado!|Item adicionado/i).first()
    await expect(successToast).toBeVisible({ timeout: 8000 })

    // 9. Confirmação visual do produto listado na tabela
    console.log('9. Confirmando se o novo produto aparece na lista...')
    await expect(page.getByText(ITEM_NAME)).toBeVisible({ timeout: 8000 })
    console.log(`✅ Fluxo Crítico validado com sucesso! Produto "${ITEM_NAME}" cadastrado e visível.`)
  })
})
