document.addEventListener('DOMContentLoaded', () => {
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.body.classList.add('is-loading');
    window.requestAnimationFrame(() => document.body.classList.remove('is-loading'));
    
    // 1. Sticky Navbar Transition
    const header = document.querySelector('.glass-header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 60) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 1b. Mobile Navbar (hamburger)
    const navToggle = document.querySelector('.nav-toggle');
    const navClose = document.querySelector('.nav-close');
    const navLinks = document.querySelector('.nav-links');
    const navBackdrop = document.querySelector('.nav-backdrop');

    const setBackdropHidden = (hidden) => {
        if (!navBackdrop) return;
        if (hidden) {
            navBackdrop.setAttribute('hidden', '');
        } else {
            navBackdrop.removeAttribute('hidden');
        }
    };

    const openNav = () => {
        document.body.classList.add('nav-open');
        if (navToggle) {
            navToggle.setAttribute('aria-expanded', 'true');
            navToggle.setAttribute('aria-label', 'Close menu');
        }
        setBackdropHidden(false);
    };

    const closeNav = () => {
        document.body.classList.remove('nav-open');
        if (navToggle) {
            navToggle.setAttribute('aria-expanded', 'false');
            navToggle.setAttribute('aria-label', 'Open menu');
        }

        if (!navBackdrop) return;
        if (prefersReducedMotion) {
            setBackdropHidden(true);
            return;
        }

        window.setTimeout(() => {
            if (!document.body.classList.contains('nav-open')) {
                setBackdropHidden(true);
            }
        }, 360);
    };

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            const isOpen = document.body.classList.contains('nav-open');
            if (isOpen) closeNav();
            else openNav();
        });
    }

    if (navClose) navClose.addEventListener('click', closeNav);
    if (navBackdrop) navBackdrop.addEventListener('click', closeNav);

    if (navLinks) {
        navLinks.querySelectorAll('a').forEach((a) => {
            a.addEventListener('click', () => {
                if (document.body.classList.contains('nav-open')) closeNav();
            });
        });
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
            closeNav();
        }
    });

    // 2. Intersection Observer (General Reveals)
    const revealEls = [...document.querySelectorAll('.reveal')];

    const applyStaggers = (root) => {
        const staggers = [...root.querySelectorAll('.stagger')];
        staggers.forEach((el, i) => {
            el.style.setProperty('--stagger', String(i));
        });
    };

    revealEls.forEach(applyStaggers);

    if (prefersReducedMotion) {
        revealEls.forEach((el) => el.classList.add('active'));
    } else {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('active');
                revealObserver.unobserve(entry.target);
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -10% 0px'
        });

        revealEls.forEach(el => revealObserver.observe(el));
    }

    // 3. Smooth 3D Card Tilt (damped)
    const cards = [...document.querySelectorAll('.card')];
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    cards.forEach((card) => {
        if (prefersReducedMotion) return;

        let raf = 0;
        let targetRX = 0;
        let targetRY = 0;
        let currentRX = 0;
        let currentRY = 0;
        let isHovering = false;

        const render = () => {
            raf = 0;
            const ease = 0.12;
            currentRX += (targetRX - currentRX) * ease;
            currentRY += (targetRY - currentRY) * ease;

            const lift = isHovering ? -10 : 0;
            card.style.transform = `perspective(1100px) translateY(${lift}px) rotateX(${currentRX}deg) rotateY(${currentRY}deg)`;

            if (Math.abs(targetRX - currentRX) > 0.01 || Math.abs(targetRY - currentRY) > 0.01) {
                raf = window.requestAnimationFrame(render);
            }
        };

        const schedule = () => {
            if (raf) return;
            raf = window.requestAnimationFrame(render);
        };

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;

            const maxRot = 9;
            targetRX = clamp((0.5 - y) * (maxRot * 2), -maxRot, maxRot);
            targetRY = clamp((x - 0.5) * (maxRot * 2), -maxRot, maxRot);
            isHovering = true;
            schedule();
        });

        card.addEventListener('mouseleave', () => {
            targetRX = 0;
            targetRY = 0;
            isHovering = false;
            schedule();
        });
    });

    // 4. Scroll Parallax (requestAnimationFrame)
    const parallaxEls = [...document.querySelectorAll('.parallax')];
    if (!prefersReducedMotion && parallaxEls.length) {
        let ticking = false;

        const updateParallax = () => {
            ticking = false;
            const vh = window.innerHeight || 1;

            parallaxEls.forEach((el) => {
                const rect = el.getBoundingClientRect();
                const strength = Number(el.dataset.parallax || '0.15');

                const progress = (rect.top + rect.height * 0.2) / (vh + rect.height);
                const centered = (progress - 0.5) * 2;
                const offset = centered * strength * 60;

                const baseScale = el.classList.contains('zoom-img') ? 1.0 : 1.08;
                el.style.transform = `translate3d(0, ${offset}px, 0) scale(${baseScale})`;
            });
        };

        const requestTick = () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(updateParallax);
        };

        window.addEventListener('scroll', requestTick, { passive: true });
        window.addEventListener('resize', requestTick);
        requestTick();
    }
});