document.getElementById("dark-toggle").addEventListener("change", function (e) {
    e.preventDefault();
    if (e.target.checked) {
      document.getElementById("toggle-div").classList.add("night");
    } else {
      document.getElementById("toggle-div").classList.remove("night");
    }
  });
  