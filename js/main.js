// Mobile Menu Toggle
function toggleMobileMenu() {
  const navLinks = document.querySelector('.nav-links');
  navLinks.classList.toggle('active');
}

// Close menu on outside click
document.addEventListener('click', function(event) {
  const mobileBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  
  if (!mobileBtn.contains(event.target) && !navLinks.contains(event.target)) {
    navLinks.classList.remove('active');
  }
});

// Close menu on link click
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelector('.nav-links').classList.remove('active');
  });
});
