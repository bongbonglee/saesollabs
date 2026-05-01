(function () {
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.documentElement.classList.add("js-enabled");

    var revealItems = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));

    if (reduceMotion || !("IntersectionObserver" in window)) {
        revealItems.forEach(function (item) {
            item.classList.add("is-visible");
        });
    } else {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) {
                    return;
                }

                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        }, {
            rootMargin: "0px 0px -12% 0px",
            threshold: 0.16
        });

        revealItems.forEach(function (item) {
            observer.observe(item);
        });
    }

    var shotClassNames = {
        left: "is-shot-left-active",
        main: "is-shot-main-active",
        right: "is-shot-right-active"
    };

    function shotKeyFor(item) {
        if (item.classList.contains("device-shot--left")) {
            return "left";
        }

        if (item.classList.contains("device-shot--right")) {
            return "right";
        }

        return "main";
    }

    function setActiveShot(stage, activeKey) {
        Object.keys(shotClassNames).forEach(function (key) {
            stage.classList.toggle(shotClassNames[key], key === activeKey);
        });

        Array.prototype.forEach.call(stage.querySelectorAll(".device-shot"), function (item) {
            var isActive = shotKeyFor(item) === activeKey;
            item.classList.toggle("is-active", isActive);
            item.setAttribute("aria-pressed", isActive ? "true" : "false");
        });
    }

    Array.prototype.forEach.call(document.querySelectorAll(".device-stage"), function (stage) {
        var shots = Array.prototype.slice.call(stage.querySelectorAll(".device-shot"));

        if (shots.length === 0) {
            return;
        }

        shots.forEach(function (item) {
            var key = shotKeyFor(item);
            var image = item.querySelector("img");
            var label = image && image.getAttribute("alt") ? image.getAttribute("alt") : "ooparts preview";

            item.setAttribute("role", "button");
            item.setAttribute("tabindex", "0");
            item.setAttribute("aria-label", label);

            item.addEventListener("click", function () {
                setActiveShot(stage, key);
            });

            item.addEventListener("keydown", function (event) {
                if (event.key !== "Enter" && event.key !== " ") {
                    return;
                }

                event.preventDefault();
                setActiveShot(stage, key);
            });
        });

        setActiveShot(stage, "main");
    });
}());
