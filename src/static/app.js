document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset the activity select options (keep the placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

          // Build participants list DOM
          const participants = Array.isArray(details.participants) ? details.participants : [];
          const participantsDiv = document.createElement('div');
          participantsDiv.className = 'participants';
          const h5 = document.createElement('h5');
          h5.textContent = 'Participants';
          participantsDiv.appendChild(h5);

          const ul = document.createElement('ul');
          ul.className = 'participants-list';

          if (participants.length === 0) {
            const li = document.createElement('li');
            li.className = 'participant-item empty';
            li.textContent = 'No participants yet';
            ul.appendChild(li);
          } else {
            participants.forEach((p) => {
              const li = document.createElement('li');
              li.className = 'participant-item';
              li.dataset.email = p;

              const span = document.createElement('span');
              span.className = 'participant-email';
              span.textContent = p;

              const del = document.createElement('button');
              del.type = 'button';
              del.className = 'delete-btn';
              del.title = 'Unregister participant';
              del.innerHTML = '&times;';
              del.dataset.activity = name;
              del.dataset.email = p;

              // Click handler for delete button
              del.addEventListener('click', async (e) => {
                e.preventDefault();
                const activityName = del.dataset.activity;
                const email = del.dataset.email;
                try {
                  const resp = await fetch(`/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
                  const body = await resp.json();
                  if (resp.ok) {
                    // Remove the list item from the DOM
                    li.remove();
                    // If the list is empty now, show the empty state
                    if (ul.querySelectorAll('.participant-item').length === 0) {
                      const emptyLi = document.createElement('li');
                      emptyLi.className = 'participant-item empty';
                      emptyLi.textContent = 'No participants yet';
                      ul.appendChild(emptyLi);
                    }
                  } else {
                    console.error('Failed to unregister:', body);
                    alert(body.detail || 'Failed to unregister participant');
                  }
                } catch (err) {
                  console.error('Error unregistering participant:', err);
                  alert('Network error while unregistering participant');
                }
              });

              li.appendChild(span);
              li.appendChild(del);
              ul.appendChild(li);
            });
          }

          participantsDiv.appendChild(ul);

          activityCard.innerHTML = `
            <h4>${name}</h4>
            <p>${details.description}</p>
            <p><strong>Schedule:</strong> ${details.schedule}</p>
            <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          `;

          activityCard.appendChild(participantsDiv);

          activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the UI reflects the new participant immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
