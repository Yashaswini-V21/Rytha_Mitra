document.addEventListener("DOMContentLoaded", () => {
    initSplash();
    initTyping();
    initRevealObserver();
    initTabs();
    initNavigation();
    initQuickStart();
    initFormSubmission();
    setSampleValues();
});

function initSplash() {
    const splash = document.getElementById("splashScreen");
    const enterBtn = document.getElementById("enterExperience");
    if (!splash || !enterBtn) {
        return;
    }
    let finished = false;

    const hideSplash = () => {
        if (finished) {
            return;
        }
        finished = true;
        splash.classList.add("revealing");
        setTimeout(() => {
            splash.classList.add("hide");
        }, 680);
    };

    enterBtn.addEventListener("click", hideSplash);
    setTimeout(hideSplash, 3200);
}

function initTyping() {
    const el = document.getElementById("typingText");
    if (!el) {
        return;
    }

    const words = [
        "climate awareness",
        "AI crop confidence",
        "market intelligence",
        "women-first advisory"
    ];
    let wordIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function frame() {
        const word = words[wordIndex];
        el.textContent = deleting
            ? word.slice(0, charIndex - 1)
            : word.slice(0, charIndex + 1);

        charIndex = deleting ? charIndex - 1 : charIndex + 1;

        let delay = deleting ? 40 : 80;
        if (!deleting && charIndex === word.length) {
            deleting = true;
            delay = 900;
        }
        if (deleting && charIndex === 0) {
            deleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            delay = 260;
        }

        setTimeout(frame, delay);
    }

    frame();
}

function initRevealObserver() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) {
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15 }
    );

    items.forEach((item) => observer.observe(item));
}

function initNavigation() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", (e) => {
            const targetSelector = anchor.getAttribute("href");
            if (!targetSelector || targetSelector === "#") {
                return;
            }
            const target = document.querySelector(targetSelector);
            if (!target) {
                return;
            }
            e.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });
}

function initTabs() {
    const tabs = document.querySelectorAll(".tab");
    if (!tabs.length) {
        return;
    }

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            activateTab(tab.dataset.tab);
        });
    });
}

function activateTab(name) {
    document.querySelectorAll(".tab").forEach((tab) => {
        tab.classList.toggle("active", tab.dataset.tab === name);
    });

    document.querySelectorAll(".tab-panel").forEach((panel) => {
        panel.classList.remove("active");
    });

    const activePanel = document.getElementById(`tab-${name}`);
    if (activePanel) {
        activePanel.classList.add("active");
    }
}

function initQuickStart() {
    const startBtn = document.getElementById("gotoDashboard");
    if (!startBtn) {
        return;
    }
    startBtn.addEventListener("click", () => {
        window.location.href = "core.html#advisory";
    });
}

function setSampleValues() {
    const district = document.getElementById("district");
    if (!district) {
        return;
    }
    document.getElementById("district").value = "Raichur";
    document.getElementById("land").value = "2";
    document.getElementById("temperature").value = "31.5";
    document.getElementById("humidity").value = "62";
    document.getElementById("rainfall").value = "92";
    document.getElementById("ph").value = "6.7";
    document.getElementById("N").value = "82";
    document.getElementById("P").value = "42";
    document.getElementById("K").value = "38";
    document.getElementById("inputCosts").value = "18000";
}

function initFormSubmission() {
    const form = document.getElementById("advisorForm");
    const submitBtn = document.getElementById("submitBtn");
    if (!form || !submitBtn) {
        return;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const payload = {
            N: parseFloat(document.getElementById("N").value),
            P: parseFloat(document.getElementById("P").value),
            K: parseFloat(document.getElementById("K").value),
            temperature: parseFloat(document.getElementById("temperature").value),
            humidity: parseFloat(document.getElementById("humidity").value),
            ph: parseFloat(document.getElementById("ph").value),
            rainfall: parseFloat(document.getElementById("rainfall").value),
            district: document.getElementById("district").value,
            inputCosts: parseFloat(document.getElementById("inputCosts").value),
            land: parseFloat(document.getElementById("land").value)
        };

        submitBtn.disabled = true;
        submitBtn.textContent = "Analyzing...";

        try {
            const response = await fetch("/api/recommend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (data.ok && data.result) {
                displayResults(data.result, payload);
            } else {
                showError(data.error || "Unable to get advisory");
            }
        } catch (error) {
            showError("Network issue. Please try again.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Get Advisory";
        }
    });
}

function displayResults(result, payload) {
    const container = document.getElementById("resultsContainer");
    const content = document.getElementById("resultsContent");
    container.style.display = "block";

    let safeResult = result;
    if (typeof safeResult === "string") {
        try {
            safeResult = JSON.parse(safeResult);
        } catch (_e) {
            safeResult = { summary: safeResult };
        }
    }

    const cards = [];

    cards.push(`
        <div class="recommendation-card">
            <div class="recommendation-title">Farm Snapshot</div>
            <div class="recommendation-desc">
                District: ${escapeHtml(payload.district)} | Land: ${payload.land} acres | Temp: ${payload.temperature} deg C | Rainfall: ${payload.rainfall} mm
            </div>
        </div>
    `);

    if (safeResult.crop_recommendations) {
        const rec = Array.isArray(safeResult.crop_recommendations)
            ? safeResult.crop_recommendations.join(", ")
            : String(safeResult.crop_recommendations);
        cards.push(`
            <div class="recommendation-card">
                <div class="recommendation-title">Top Crop Recommendations</div>
                <div class="recommendation-desc">${escapeHtml(rec)}</div>
            </div>
        `);
    }

    if (safeResult.explanation) {
        cards.push(`
            <div class="recommendation-card">
                <div class="recommendation-title">Why These Crops</div>
                <div class="recommendation-desc">${escapeHtml(String(safeResult.explanation))}</div>
            </div>
        `);
    }

    if (safeResult.market_insights) {
        cards.push(`
            <div class="recommendation-card">
                <div class="recommendation-title">Market Insights</div>
                <div class="recommendation-desc">${escapeHtml(String(safeResult.market_insights))}</div>
            </div>
        `);
    }

    if (safeResult.climate_tips) {
        cards.push(`
            <div class="recommendation-card">
                <div class="recommendation-title">Climate Tips</div>
                <div class="recommendation-desc">${escapeHtml(String(safeResult.climate_tips))}</div>
            </div>
        `);
    }

    if (cards.length === 1 && safeResult.summary) {
        cards.push(`
            <div class="recommendation-card">
                <div class="recommendation-title">Advisory Summary</div>
                <div class="recommendation-desc">${escapeHtml(String(safeResult.summary))}</div>
            </div>
        `);
    }

    content.innerHTML = cards.join("\n");
    container.scrollIntoView({ behavior: "smooth", block: "center" });
}

function showError(message) {
    const container = document.getElementById("resultsContainer");
    const content = document.getElementById("resultsContent");
    container.style.display = "block";
    content.innerHTML = `
        <div class="recommendation-card">
            <div class="recommendation-title">Error</div>
            <div class="recommendation-desc">${escapeHtml(message)}</div>
        </div>
    `;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
