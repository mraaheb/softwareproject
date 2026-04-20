/**
 * ADUD — index.js
 * Landing Page JavaScript
 */

// ══ Navbar scroll effect ══
const navbar = document.getElementById('navbar');

if (navbar) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// ══ Animated counter for stats ══
function animateCounter(el, target, duration = 1800) {
    let start = 0;
    const stepTime = 16;
    const increment = target / (duration / stepTime);

    const timer = setInterval(() => {
        start += increment;

        if (start >= target) {
            start = target;
            clearInterval(timer);
        }

        el.textContent = Math.floor(start);
    }, stepTime);
}

// ══ Intersection Observer for stats bar ══
const statsBar = document.querySelector('.stats-bar');

if (statsBar && 'IntersectionObserver' in window) {
    const statsObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                document.querySelectorAll('.stat-num').forEach(el => {
                    const target = parseInt(el.getAttribute('data-target'), 10) || 0;
                    animateCounter(el, target);
                });
                observer.disconnect();
            }
        });
    }, { threshold: 0.5 });

    statsObserver.observe(statsBar);
} else {
    document.querySelectorAll('.stat-num').forEach(el => {
        const target = parseInt(el.getAttribute('data-target'), 10) || 0;
        el.textContent = target;
    });
}

// ══ Fade-in on scroll for sections ══
const animatedElements = document.querySelectorAll('.feat-card, .step, .role-card');

if ('IntersectionObserver' in window && animatedElements.length) {
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                fadeObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(24px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        fadeObserver.observe(el);
    });
} else {
    animatedElements.forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
    });
}

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
        const targetSelector = link.getAttribute('href');

        if (!targetSelector || targetSelector === '#') return;

        const target = document.querySelector(targetSelector);

        if (target) {
            e.preventDefault();
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

console.log('ADUD Landing Page loaded ✓');