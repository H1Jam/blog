const apiResultDisplay = document.getElementById('posts');

function fetchPersonsData(url) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('posts:', data);
            data.forEach(post => {
                apiResultDisplay.innerHTML += `<div class="blog-posts"><div class="blog-posts-header">${post.title.rendered}</div>${post.excerpt.rendered}<div>${post.date}</div></div>`;
            });
        })
        .catch(error => console.error('Error fetching data:', error));
}

const dataUrl = 'https://hjam.ca/wp-json/wp/v2/posts?per_page=10&context=embed';

fetchPersonsData(dataUrl);
