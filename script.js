const apiResultDisplay = document.getElementById('posts');
const postsLoading = document.getElementById('posts-loading');

// Set footer year
const footerYear = document.getElementById('footer-year');
if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
}

let allPosts = [];

// Capture any incoming hash BEFORE replaceState clears it, so deep links
// like #post-6 still work after the async JSON fetch completes.
const _initialHash = window.location.hash;

// Seed the history stack so the browser back button always returns to the posts list
history.replaceState({ view: 'list' }, '', window.location.pathname + window.location.search);

function initializeCopyButtons() {
    const copyButtons = document.querySelectorAll('[data-copy-target]');

    copyButtons.forEach(button => {
        if (button.dataset.copyBound === 'true') {
            return;
        }

        const originalLabel = button.textContent;

        button.addEventListener('click', async () => {
            const targetSelector = button.dataset.copyTarget;
            const target = targetSelector ? document.querySelector(targetSelector) : null;

            if (!target) {
                console.warn('Copy target not found for selector:', targetSelector);
                return;
            }

            const codeToCopy = target.innerText;

            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(codeToCopy);
                } else {
                    const tempTextArea = document.createElement('textarea');
                    tempTextArea.value = codeToCopy;
                    tempTextArea.style.position = 'fixed';
                    tempTextArea.style.opacity = '0';
                    document.body.appendChild(tempTextArea);
                    tempTextArea.focus();
                    tempTextArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(tempTextArea);
                }

                button.textContent = 'Copied!';
                button.classList.add('copied');
                setTimeout(() => {
                    button.textContent = originalLabel;
                    button.classList.remove('copied');
                }, 1600);
            } catch (err) {
                console.error('Unable to copy code', err);
                button.textContent = 'Error';
                setTimeout(() => {
                    button.textContent = originalLabel;
                }, 1600);
            }
        });

        button.dataset.copyBound = 'true';
    });
}

function addCodeCopyButtons(container) {
    container.querySelectorAll('pre').forEach(pre => {
        if (pre.parentElement.classList.contains('code-snippet')) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'code-snippet';
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        const btn = document.createElement('button');
        btn.className = 'code-copy-btn';
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Copy code');
        btn.textContent = 'Copy';
        wrapper.insertBefore(btn, pre);

        btn.addEventListener('click', async () => {
            const codeToCopy = pre.innerText;
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(codeToCopy);
                } else {
                    const ta = document.createElement('textarea');
                    ta.value = codeToCopy;
                    ta.style.position = 'fixed';
                    ta.style.opacity = '0';
                    document.body.appendChild(ta);
                    ta.focus();
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                }
                btn.textContent = 'Copied!';
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.textContent = 'Copy';
                    btn.classList.remove('copied');
                }, 1600);
            } catch (err) {
                console.error('Unable to copy code', err);
                btn.textContent = 'Error';
                setTimeout(() => { btn.textContent = 'Copy'; }, 1600);
            }
        });
    });
}

function getExcerpt(htmlContent) {
    const temp = document.createElement('div');
    temp.innerHTML = htmlContent;
    const firstP = temp.querySelector('p');
    return firstP ? firstP.outerHTML : '';
}

function showPostsList() {
    document.querySelector('.code-card').hidden = false;
    document.querySelector('.posts-section').hidden = false;
    document.getElementById('post-view').hidden = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showPost(index) {
    const post = allPosts[index];
    if (!post) return;

    const postView = document.getElementById('post-view');
    postView.querySelector('.post-article-title').textContent = post.title;
    postView.querySelector('.post-article-meta').textContent = `${post.author} · ${formatDate(post.date)}`;
    postView.querySelector('.post-article-content').innerHTML = post.content;

    // Rewrite root-relative image paths (e.g. /images/foo.jpg) so they resolve
    // correctly under any subdirectory host (like GitHub Pages /repo-name/)
    // without hardcoding the URL.
    const _base = new URL('.', document.baseURI).href;
    postView.querySelectorAll('.post-article-content img').forEach(img => {
        const src = img.getAttribute('src');
        if (src && src.startsWith('/') && !src.startsWith('//')) {
            img.setAttribute('src', new URL(src.slice(1), _base).href);
        }
    });

    document.querySelector('.code-card').hidden = true;
    document.querySelector('.posts-section').hidden = true;
    postView.hidden = false;

    if (window.hljs) window.hljs.highlightAll();
    addCodeCopyButtons(postView.querySelector('.post-article-content'));
    initializeCopyButtons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderPosts() {
    allPosts.forEach((post, index) => {
        apiResultDisplay.innerHTML +=
        `<div class="blog-posts">
            <div class="blog-posts-header">${post.title}</div>
            <div class="blog-posts-content">${getExcerpt(post.content)}</div>
            <div class="blog-posts-footer">
                <span>${formatDate(post.date)}</span>
                <button class="read-more-btn" data-post-index="${index}">Read More →</button>
            </div>
        </div>`;
    });

    document.querySelectorAll('.read-more-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.postIndex);
            history.pushState({ view: 'post', index }, '', `#post-${index}`);
            showPost(index);
        });
    });

    if (window.hljs) window.hljs.highlightAll();
    initializeCopyButtons();
}

function fetchPersonsData(url) {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (postsLoading) postsLoading.remove();
            allPosts = data;
            renderPosts();
            // Support deep-linking via URL hash (e.g. /blog/#post-6).
            // Use _initialHash because replaceState already cleared window.location.hash.
            const match = _initialHash.match(/^#post-(\d+)$/);
            if (match) {
                const index = parseInt(match[1]);
                history.pushState({ view: 'post', index }, '', `#post-${index}`);
                showPost(index);
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            if (postsLoading) {
                postsLoading.innerHTML = `<div class="posts-error">Could not load posts. Please try again later.</div>`;
            }
        });
}

// api gives us something like this "2021-04-02T13:53:23" 
// but we want to display it like this "April 2, 2021" 
// so we use this function to format the date.
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
}

document.getElementById('post-back-btn').addEventListener('click', () => {
    history.back();
});

window.addEventListener('popstate', (event) => {
    if (event.state && event.state.view === 'post') {
        showPost(event.state.index);
    } else {
        showPostsList();
    }
});

const dataUrl = new URL('blog_posts.json', document.baseURI).href;
fetchPersonsData(dataUrl);
