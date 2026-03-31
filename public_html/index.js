/**
 * ADUD — index.js
 * Landing Page JavaScript
 */

// ══ Navbar scroll effect ══
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ══ Animated counter for stats ══
function animateCounter(el, target, duration = 1800) {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
        start += step;
        if (start >= target) {
            start = target;
            clearInterval(timer);
        }
        el.textContent = Math.floor(start);
    }, 16);
}

// ══ Intersection Observer for stats bar ══
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            document.querySelectorAll('.stat-num').forEach(el => {
                const target = parseInt(el.getAttribute('data-target'));
                animateCounter(el, target);
            });
            statsObserver.disconnect();
        }
    });
}, { threshold: 0.5 });

const statsBar = document.querySelector('.stats-bar');
if (statsBar) statsObserver.observe(statsBar);

// ══ Fade-in on scroll for sections ══
const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.feat-card, .step, .role-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    fadeObserver.observe(el);
});

// ══ Stagger feature cards ══
document.querySelectorAll('.feat-card').forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.07}s`;
});

// ══ Stagger steps ══
document.querySelectorAll('.step').forEach((step, i) => {
    step.style.transitionDelay = `${i * 0.1}s`;
});

// ══ Smooth scroll for nav links ══
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

console.log('ADUD Landing Page loaded ✓');