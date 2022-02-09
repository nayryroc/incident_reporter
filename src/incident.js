class Incident {
    constructor(units, responding, received_time, incident_complete, location, incident_type) {
        this.units = units;
        this.responding = responding;
        this.received_time = received_time;
        this.incident_complete = incident_complete;
        this.location = location;
        this.incident_type = incident_type;
        this.dateObj = new Date(this.received_time.toDate());

    }

    /**
     * Sets incident_complete to true
     */
    complete(){
        this.incident_complete = true;
    }

    /**
     * Gets the date of the incident
     */
    getDate(){
        let month = this.dateObj.getMonth() + 1;
        month = (month > 9) ? month : "0" + month;
        let day = this.dateObj.getDate();
        day = (day > 9) ? day : "0" + day;
        let year = this.dateObj.getFullYear();

        return month + "/" + day + "/" + year;
    }

    /**
     * Gets the time of the incident
     */
    getTime(){
        let hours = this.dateObj.getHours();
        hours = (hours > 9) ? hours : '0' + hours;
        let minutes = this.dateObj.getMinutes();
        minutes = (minutes > 9) ? minutes : '0' + minutes;

        return hours + ":" + minutes;
    }

    /**
     * Gets the address of the incident
     */
    getAddress(){
        return this.location;
    }
}

    export var incidentConverter = {
        toFirestore: function(incident) {
            return {
                units: incident.units,
                responding: incident.responding,
                received_time: incident.received_time,
                incident_complete: incident.incident_complete,
                location: incident.location,
                incident_type: incident.incident_type,
            };
        },
        fromFirestore: function(snapshot, options){
            const data = snapshot.data(options);
            return new Incident(data.units, data.responding, data.received_time, data.incident_complete, data.location, data.incident_type);
        }
    };

export default Incident;