// JavaScript for handling the search and updating content
$(document).ready(function () {
    $('#searchForm').submit(function (event) {
        // Prevent the default form submission
        event.preventDefault();

        // Get the search query (date of birth)
        const searchDob = $('#searchDob').val();

        // Make an AJAX request to the server
        $.ajax({
            type: 'GET',
            url: '/search',
            data: { dob: searchDob },
            success: function (data) {
                if (data.error) {
                    // Server returned an error message
                    displayErrorMessage(data.error);
                } else if (data.matchingUsers.length > 0) {
                    // Matching users found, update the content with the search results
                    const ul = $('<ul></ul>');
                    const nameSet = new Set();

                    data.matchingUsers.forEach(matchingUser => { 
                        console.log('Image Path:', matchingUser.image);
                        const isSameName = nameSet.has(matchingUser.firstName);
                        const userImage = new Image();
                        
                        userImage.onerror = function () {
                            console.error('Image failed to load:', matchingUser.image);
                        };

                        userImage.src = matchingUser.image;
                        
                        ul.append(`
                            <li class="${isSameName ? 'green-user' : 'normal-user'}">
                                <div class="user-info">
                                    <img class="user-image" src="${matchingUser.image}" alt="${matchingUser.firstName} image" style="width: 239px; height: 160px;">
                                </div>
                                <div class="user-details">
                                    <span>${matchingUser.firstName} (${matchingUser.dob})</span>
                                    <a href="#" class="learn-more" data-user-id="${matchingUser.id}">Learn More</a>
                                    <div class="user-description" id="description-${matchingUser.id}" style="display: none;">
                                        ${matchingUser.description}
                                    </div>
                                </div>
                            </li>
                        `);

                        if (!isSameName) {
                            nameSet.add(matchingUser.firstName);
                        }
                    });

                    $('#resultsContainer').html('<h3>Matching Users:</h3>').append(ul);
                    $('#errorMessage').hide();  // Hide error message if it was previously shown

                    // Attach click event for "Learn More" links
                    $('.learn-more').click(function() {
                        const userId = $(this).data('user-id');
                        $(`#description-${userId}`).toggle();
                    });
                } else {
                    // No matching users found
                    displayErrorMessage(`No matching users found for ${searchDob}.`);
                }
            },
            error: function (xhr, status, error) {
                // Handle errors, including 404 Not Found
                if (xhr.status === 404) {
                    displayErrorMessage('No matching users found.');
                } else {
                    displayErrorMessage(`Error: ${error}`);
                }
            }
        });
    });

    function displayErrorMessage(message) {
        $('#resultsContainer').html('');  // Clear previous results
        $('#errorMessage').text(message).show();
        setTimeout(() => {
            $('#errorMessage').hide().text('');
        }, 2000);
    }
});
