class Incident {
    constructor(created_at, eta, incident_complete, incident_type, location, responding, status, units, fire_departments) {
        this.units = units;
        this.responding = responding;
        this.created_at = created_at;
        this.incident_complete = incident_complete;
        this.location = location;
        this.incident_type = incident_type;
        this.dateObj = new Date(this.created_at.toDate());
        this.eta = eta;
        this.status = status;
        this.fire_departments = fire_departments;
    }

    /**
     * Sets incident_complete to true
     */
    complete(){
        this.incident_complete = true;
    }

    /**
     *
     * @returns {String[]} fire department ids
     */
    getDepartments(){
        return this.fire_departments;
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
                created_at: incident.created_at,
                incident_complete: incident.incident_complete,
                location: incident.location,
                incident_type: incident.incident_type,
                eta: incident.eta,
                status: incident.status,
                fire_departments: incident.fire_departments
            };
        },
        fromFirestore: function(snapshot, options){
            const data = snapshot.data(options);
            return new Incident(data.created_at, data.eta, data.incident_complete, data.incident_type, data.location, data.responding, data.status, data.units, data.fire_departments);
        }
    };

export default Incident;