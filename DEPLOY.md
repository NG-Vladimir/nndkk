# Как опубликовать в интернет

## Вариант 1: Netlify Drop (самый простой)

1. Откройте в браузере: **https://app.netlify.com/drop**
2. Перетащите папку `График` в окно браузера
3. Через несколько секунд появится ссылка — откройте её на телефоне

Ссылка будет работать постоянно. Можно добавить страницу на главный экран телефона.

---

## Вариант 2: GitHub Pages

1. Создайте аккаунт на GitHub, если его ещё нет
2. Создайте новый репозиторий (например, `grafyk`)
3. В терминале выполните:

```bash
cd "/Users/vladimir/Desktop/График"
git init
git add .
git commit -m "График служений"
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/grafyk.git
git push -u origin main
```

4. В настройках репозитория: **Settings** → **Pages** → **Source**: Deploy from branch → выберите `main` и папку `/ (root)` → Save
5. Через минуту сайт будет доступен по адресу:  
   `https://ВАШ_ЛОГИН.github.io/grafyk/`
