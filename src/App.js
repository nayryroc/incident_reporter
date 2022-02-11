import './App.css';
import db from './firebase';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';


import React from "react";

import {incidentConverter} from './incident';
import Incident from './incident';
import firebase from 'firebase/compat/app';

let timeout;
class App extends React.Component{

    state = {
        incidents: [],
        incidentTypes: [],
        invalid: false,
    }


    componentDidMount() {
       this.updateState();
    }

    /**
     * Loads data from the database and sets the state
     */
    updateState(){
        let page = document.getElementsByClassName('page')[0];
        page.classList.add('loading');
        //Load incident types into state
        db.collection('incident_types').get().then((querySnapshot) => {
            let types = [];
            querySnapshot.docs.map(doc => {
                types.push({data: doc.data().type_name, key: doc.id});
            });
            this.setState({incidentTypes : types})
            page.classList.remove('loading');
        }).catch((error) => {
            console.log("Error reading document: " + error);
        });


        //load active incidents into state
        db.collection('incident').where("incident_complete", "==", false).withConverter(incidentConverter).orderBy("received_time", "desc").get().then((querySnapshot) => {
            let arr = [];
            querySnapshot.docs.map(doc => {
                arr.push({data: doc.data(), key: doc.id});
            });

            this.setState({incidents : arr})
        }).catch((error) => {
            console.log("Error reading document: " + error)
        })
    }

    animateRefresh(){
        let button = document.getElementsByClassName("active-incidents__refresh")[0];
        button.classList.add("refreshing");

        clearTimeout(timeout);
        timeout = setTimeout(() => {
            button.classList.remove("refreshing");
        }, 400)
    }


    /**
     * Returns the incident type.
     *
     * @param {string} incidentTypeKey The key of the incident type.
     */
    getIncidentType(incidentTypeKey){
        let types = this.state.incidentTypes;
        let title = null

        types.forEach((type) => {
            if(type.key === incidentTypeKey) title = type.data;
        })

        return title;
    }

    /**
     * Concludes an incident
     *
     * @param {string} incidentKey The key of the incident.
     * @param {Incident} incident The incident object
     * @param {string} cardID The id of the card element displayed in the DOM
     *
     */
    concludeIncident(incidentKey, incident, cardID){

        incident.complete();

        db.collection('incident').doc(incidentKey).withConverter(incidentConverter).set(incident).catch((error) => {
         console.log("Error updating document: " + error);
        });

        let wrapper = document.getElementsByClassName('active-incidents')[0];

        let card = document.getElementById(cardID);
        if(card){
            card.classList.add("active-incidents__deactivate");
            card.style.height = card.clientHeight + 'px';
            card.style.paddingTop = '0';
            card.style.paddingBottom = '0';
            wrapper.style.minHeight = wrapper.clientHeight + 'px';
        }

        window.addEventListener('scroll', this.checkScroll)

        setTimeout(() => {
            this.remIncident(incidentKey);
            card.classList.remove("active-incidents__deactivate");
            card.style.height = '';
            card.style.paddingTop = '';
            card.style.paddingBottom = '';

        }, 500);
    }

    /**
     *
     * Check if scroll reached top of the active incidents wrapper.
     * If it is reset the height of the wrapper
     *
     */
    checkScroll(){
        const winScroll =
            document.body.scrollTop || document.documentElement.scrollTop

        const top = window.innerHeight;

        if(winScroll <= top){
            let wrapper = document.getElementsByClassName('active-incidents')[0];
            wrapper.style.minHeight = '';
            window.removeEventListener('scroll', this.checkScroll);
        }
    }


    /**
     * Removes an incident from state
     *
     * @param {string} key The key of the incident
     */
    remIncident(key){
        let updated = this.state.incidents.filter((i) => { return i.key !== key; });
        this.setState({incidents: updated});
    }


    /**
     * Open the takeover menu form
     */
    openTakeover(){
            let takeover = document.getElementsByClassName("takeover")[0];
            takeover.classList.add("open");
            setTimeout(() => {
                takeover.style.opacity = 1;
            },10);
            setTimeout(() => {
                document.getElementsByClassName("page")[0].classList.add("no-scroll");
            }, 200);
    }


    /**
     * Close the takeover menu form
     */
    closeTakeover(){
        document.getElementsByClassName("takeover__street")[0].value = '';
        document.getElementsByClassName("takeover__city")[0].value = '';
        document.getElementsByClassName("takeover__state")[0].value = '';
        document.getElementsByClassName("takeover__zip")[0].value = '';
        document.getElementsByClassName("takeover__units")[0].value = '';
        document.getElementsByClassName("takeover__option")[0].selected = true;
        document.getElementsByClassName("takeover")[0].style.opacity = 0;

        setTimeout(() => {
            document.getElementsByClassName("takeover")[0].classList.remove("open");
            document.getElementsByClassName("takeover")[0].style.opacity = '';
            document.getElementsByClassName("page")[0].classList.remove("no-scroll");
        },200)


        this.setState({invalid: false});
    }

    /**
     *
     * Submit incident to the database
     *
     * @param {Incident} incident The incident to submit to the database
     *
     */
    submitIncident(incident){

        let newIncidentRef = db.collection("incident").doc();
        newIncidentRef.withConverter(incidentConverter).set(incident).catch((error) => {
            console.log("Error adding document: " + error);
        });

        this.closeTakeover();
        this.updateState();
    }

    /**
     *
     * Check if the form input is valid
     *
     */
    inputValidation() {

        //Get form values
        let street = document.getElementsByClassName("takeover__street")[0].value;
        let city = document.getElementsByClassName("takeover__city")[0].value;
        let state = document.getElementsByClassName("takeover__state")[0].value;
        let zip = document.getElementsByClassName("takeover__zip")[0].value;
        let units = document.getElementsByClassName("takeover__units")[0].value;

        let e = document.getElementsByClassName("takeover__type")[0];
        let type = e.options[e.selectedIndex].value;

        //find the key for the type value
        this.state.incidentTypes.forEach((t) => {
            if (t.data === type) {
                type = t.key;
            }
        });

        //reset the invalid state
        this.setState({invalid: false});


        let addr = (street + " " + city + " " + state + " " + zip);

        //Convert the units string to an array
        units = units.split(' ').filter((unit) => {
            return unit !== '';
        });


        let time = firebase.firestore.Timestamp.fromDate(new Date());


        //Make sure none of the fields are empty
        if (street === '' || city === '' || state === '' || zip === '') {
            this.setState({invalid: true});
        }else if(units.length === 0){
            this.setState({invalid: true});
        }else{
            this.submitIncident(new Incident(units, [], time, false, addr, type));
        }

    }

    render(){
       return (
           <div className={"content"}>
               <div className="takeover">
                   <div className="takeover__content">
                       <div className="takeover__input">
                           <label htmlFor={"incident_street"} className={"takeover__location-label"}>Incident Location</label>
                           <input type="text" placeholder={"Street"} className={"takeover__street"} name={"incident_street"}/>
                           <div className="takeover__row">
                               <input type="text" placeholder={"City"} className={"takeover__city"}/>
                               <input type="text" placeholder={"State"} className={"takeover__state"}/>
                               <input type="text" placeholder={"Zip"} className={"takeover__zip"}/>
                           </div>

                           <label className={"takeover__type-label"} htmlFor={"incident_type"}>Incident Type</label>
                           <select className="takeover__type" id={"incident_type"}>
                               {
                                   this.state.incidentTypes.map((type, idx) => {
                                       return <option className={"takeover__option"} key={idx} value={type.data}>{type.data}</option>
                                   })
                               }
                           </select>

                           <label htmlFor={"incident_units"} className={"takeover__units-label"}>Units</label>
                           <input type="text" name={"incident_units"} className={"takeover__units"} placeholder={"Units"}/>
                           { this.state.invalid ? <p className="takeover__error">Invalid Input</p> : '' }
                       </div>
                       <div className="takeover__buttons">
                           <button className="takeover__cancel" onClick={() => {this.closeTakeover()}}>Cancel</button>
                           <button className="takeover__submit" onClick={() => {this.inputValidation()}}>Submit</button>
                       </div>
                   </div>
               </div>

               <div className={"incident-report"}>
                <h2 className={"incident-report__header"}>New Incident</h2>
                <button className={"incident-report__report"} onClick={this.openTakeover}>Report Incident</button>
                   <a href="#active" className={"incident-report__down"} aria-label={"Scroll Down"}/>
               </div>
               <div className={"active-incidents"} id="active">
                <h2 className={"active-incidents__header"}>Active Incidents <button className={"active-incidents__refresh"} onClick={()=>{this.updateState(); this.animateRefresh()}}/></h2>
               {this.state.incidents.map(((i, idx) => {
                    let incidentType = this.getIncidentType(i.data.incident_type);

                   return (
                   <div key={idx} className={"active-incidents__card"} id={'card-' + idx}>
                       <div className={"active-incidents__content"}>
                           <div className="active-incidents__details">
                               <p>{incidentType}</p>
                               <p>{i.data.getAddress()}</p>
                               <p>{i.data.getDate()} at {i.data.getTime()}</p>
                           </div>
                           <button className={"active-incidents__conclude"} onClick={()=>{this.concludeIncident(i.key, i.data, 'card-'+idx)}}>Conclude</button>
                       </div>

                   </div>
                   );
                }))}

                   {this.state.incidents.length === 0 ? <div className={"active-incidents__card"}><div className="active-incident__content"><div className="active-incidents__none">No Active Incidents</div></div></div> : ''}
               </div>
           </div>
       );
    }
}

export default App;
