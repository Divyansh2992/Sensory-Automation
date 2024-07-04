document.addEventListener('DOMContentLoaded', function() {
    flatpickr("#todayDate", {
        dateFormat: "Y-m-d",
    });

    document.getElementById('dateForm').addEventListener('submit', function(event) {
        event.preventDefault();
        
        var dateInput = document.getElementById('todayDate').value;
        var date = new Date(dateInput);
        var dayOfWeek = date.getDay();

        if (dayOfWeek === 0) {
            alert("Sunday means Holiday, Come Back Tomorrow :)");
        } else {
            var pages = [
                'sunday.html',    // Sunday (won't be used due to alert)
                'monday.html',    // Monday
                'tuesday.html',   // Tuesday
                'wednesday.html', // Wednesday
                'thursday.html',  // Thursday
                'friday.html',    // Friday
                'saturday.html'   // Saturday
            ];

            var redirectTo = pages[dayOfWeek];
            window.location.href = redirectTo;
        }
    });
});
