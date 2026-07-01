const apiResultDisplay = document.getElementById('posts');
const postsLoading = document.getElementById('posts-loading');

// Set footer year
const footerYear = document.getElementById('footer-year');
if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
}

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

            console.log('posts:', data);
            data.forEach(post => {
                apiResultDisplay.innerHTML += 
                `<div class="blog-posts">
                    <div class="blog-posts-header">
                        ${post.title}
                    </div>
                    <div class="blog-posts-content">
                        ${post.content}
                    </div>
                    <div class="blog-posts-footer">
                        ${formatDate(post.date)}
                    </div>
                </div>`;
            });

            if (window.hljs) {
                window.hljs.highlightAll();
            }

            initializeCopyButtons();
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

const dataUrl = new URL('blog_posts.json', document.baseURI).href;

fetchPersonsData(dataUrl);

if (window.hljs) {
    window.hljs.highlightAll();
}

initializeCopyButtons();

// const queryString = window.location.search;
// console.log('Blog URL Query String:', queryString);

// const urlParams = new URLSearchParams(queryString);
// console.log('Blog URL Parameters:', urlParams);

// const postId = urlParams.get('postId');
// console.log('Post ID from URL:', postId);
