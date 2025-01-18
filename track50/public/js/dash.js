(function ($) {
    "use strict";

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner();


    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({ scrollTop: 0 }, 1500, 'easeInOutExpo');
        return false;
    });

    // Sidebar Toggler
    $('.sidebar-toggler').click(function () {
        $('.sidebar, .content').toggleClass("open");
        return false;
    });


    // Progress Bar
    $('.pg-bar').waypoint(function () {
        $('.progress .progress-bar').each(function () {
            $(this).css("width", $(this).attr("aria-valuenow") + '%');
        });
    }, { offset: '80%' });


    // Calender
    $('#calender').datetimepicker({
        inline: true,
        format: 'L'
    });


    // Testimonials carousel
    $(".testimonial-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        items: 1,
        dots: true,
        loop: true,
        nav: false
    });


    // Chart Global Color
    Chart.defaults.color = "#FFFFFF";
    Chart.defaults.borderColor = "#000000";

    fetch('/getinfo').then(res => res.json()).then(e => {
        // Parse the data and convert created_at to Date objects
        e.chart.forEach(item => {
            item.created_at = new Date(item.created_at);
        });

        // Calculate the total time difference in milliseconds
        let totalMillis = 0;
        for (let i = 1; i < e.chart.length; i++) {
            totalMillis += e.chart[i].created_at - e.chart[i - 1].created_at;
        }

        // Calculate the average time difference in milliseconds
        const avgMillis = totalMillis / (e.chart.length - 1);

        // Convert the average time difference to appropriate units
        let avgTime, timeUnit;
        const millisInDay = 1000 * 60 * 60 * 24;
        const millisInMonth = millisInDay * 30.44; // Average days in a month
        const millisInYear = millisInDay * 365.25; // Average days in a year

        if (avgMillis < millisInMonth) {
            avgTime = avgMillis / millisInDay;
            timeUnit = 'days';
        } else if (avgMillis < millisInYear) {
            avgTime = avgMillis / millisInMonth;
            timeUnit = 'months';
        } else {
            avgTime = avgMillis / millisInYear;
            timeUnit = 'years';
        }

        // Prepare data for plotting
        const categories = [...new Set(e.chart.map(item => item.browser_catagory))];
        const counts = categories.map(cat => e.chart.filter(item => item.browser_catagory === cat).length);

        // Plotting the data using a simple chart library like Chart.js
        const ctx = document.getElementById('Browser_category').getContext('2d');
        const myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [{
                    label: `Average Time: ${avgTime.toFixed(2)} ${timeUnit}`,
                    data: counts,
                    backgroundColor: 'rgba(139, 195, 74, 0.2)',
                    borderColor: 'rgba(139, 195, 74, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    x: {
                        beginAtZero: true
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });


        document.getElementById('unique_visits').innerText = e.metrics[0]['unique_visits'];
        document.getElementById('avg_duration').innerText = e.metrics[0]['avg_duration'];
        document.getElementById('bounce_rate').innerText = e.metrics[0]['bounce_rate'];
        document.getElementById('username').innerText = e.name;
    }).catch(alert)
})(jQuery);
