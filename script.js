const apiResultDisplay = document.getElementById('posts');

function fetchPersonsData(url) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('posts:', data);
            data.forEach(post => {
                apiResultDisplay.innerHTML += 
                `<div class="blog-posts">
                    <div class="blog-posts-header">
                        ${post.title.rendered}
                    </div>
                    <div class="blog-posts-content">
                        ${post.excerpt.rendered}
                    </div>
                    <div class="blog-posts-footer">
                        ${formatDate(post.date)}
                    </div>
                </div>`;
            });
        })
        .catch(error => console.error('Error fetching data:', error));
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

const dataUrl = 'https://hjam.ca/wp-json/wp/v2/posts';

fetchPersonsData(dataUrl);
