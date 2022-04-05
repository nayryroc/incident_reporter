import './App.css';
import db from './firebase';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import Multiselect from "multiselect-react-dropdown";

import React from "react";

import {incidentConverter} from './incident';
import Incident from './incident';
import firebase from 'firebase/compat/app';

let timeout;
class App extends React.Component{
    multiselectRefTracker = React.createRef();

    state = {
        incidents: [],
        departments: [],
        department_names: [],
        invalid: false,
        selected: [],
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
        db.collection('fire_department').get().then((querySnapshot) => {
            let dept = [];
            let names = [];
            querySnapshot.docs.map(doc => {
                dept.push({data: doc.data().name, key: doc.id});
                names.push(doc.data().name + " : " + doc.id);
            });
            this.setState({departments : dept});
            this.setState({department_names : names});
            page.classList.remove('loading');
        }).catch((error) => {
            console.log("Error reading document: " + error);
        });


        //load active incidents into state
        db.collection('incident').where("incident_complete", "==", false).withConverter(incidentConverter).orderBy("created_at", "desc").get().then((querySnapshot) => {
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
     * @param {string[]} deptKey The key of the department.
     */
    getDept(deptKey){
        let types = this.state.departments;
        let title = [];

        types.forEach((type) => {
            if(deptKey.includes(type.key)) title.push(type.data);
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
        document.getElementsByClassName("takeover__incident")[0].value = '';
        document.getElementsByClassName("takeover__is-fire")[0].checked = false;
        document.getElementsByClassName("takeover__is-ems")[0].checked = false;
        if(document.getElementsByClassName("takeover__option")[0] != null){
            document.getElementsByClassName("takeover__option")[0].selected = true;
        }
        document.getElementsByClassName("takeover")[0].style.opacity = 0;

        setTimeout(() => {
            document.getElementsByClassName("takeover")[0].classList.remove("open");
            document.getElementsByClassName("takeover")[0].style.opacity = '';
            document.getElementsByClassName("page")[0].classList.remove("no-scroll");
        },200)

        this.setState({selected:[]});

        this.multiselectRefTracker.current.resetSelectedValues();
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
        let type = document.getElementsByClassName("takeover__incident")[0].value;
        let is_fire = document.getElementsByClassName("takeover__is-fire")[0].checked;
        let is_ems = document.getElementsByClassName("takeover__is-ems")[0].checked;


        let fire_departments = [];

        this.state.selected.map(value => {
            fire_departments.push(value);
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
        if (street === '' || city === '' || state === '' || zip === '' || type === '' || (!is_fire && !is_ems)) {
            this.setState({invalid: true});
        }else if(units.length === 0 || this.state.selected.length <= 0){
            this.setState({invalid: true});
        }else{
            if(is_fire) {
                for(let i = 0; i< fire_departments.length; i++)
                {
                    let dept = fire_departments[i];
                    fetch('https://fcm.googleapis.com/fcm/send', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'key='+ process.env.REACT_APP_API_KEY

                        },
                        body: JSON.stringify({
                            "to": "/topics/fire_" + dept,
                            "restricted_package_name": "com.example.first_responder_app",
                            "notification": {
                                "title": "Fire Incident",
                                "body": (type + '\n' + addr)
                            }
                        })

                    }).then(r => {
                    });
                }
            }
            if(is_ems) {
                for (let i = 0; i < fire_departments.length; i++) {
                    let dept = fire_departments[i];
                    fetch('https://fcm.googleapis.com/fcm/send', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'key=' + process.env.REACT_APP_API_KEY

                        },
                        body: JSON.stringify({
                            "to": "/topics/EMS_" + dept,
                            "restricted_package_name": "com.example.first_responder_app",
                            "notification": {
                                "title": "EMS Incident",
                                "body": (type + '\n' + addr)
                            }
                        })

                    }).then(r => {
                    });
                }
            }
            this.submitIncident(new Incident(time, {}, false, type, addr, [], {}, units, fire_departments, is_fire, is_ems));
        }

    }

    selectItem(selectedList, selectedItem){
        let id = selectedItem.split(" : ")[1];
        let selectedItems = this.state.selected;
        selectedItems.push(id);
        this.setState({selected:selectedItems});
    }

    removeItem(selectedList, removedItem){
        let id = removedItem.split(" : ")[1];
        let selectedItems = this.state.selected;

        selectedItems = selectedItems.filter(v => {return v !== id});
        this.setState({selected:selectedItems});
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

                           <label htmlFor={"fire-departments"} className={"takeover__units-label"}>Fire Departments</label>

                           <Multiselect
                               id={"fire-departments"}
                               isObject={false}
                               options={this.state.department_names}
                               onSelect={(selectedList, selectedItem)=>{this.selectItem(selectedList, selectedItem)}}
                               onRemove={(selectedList, selectedItem)=>{this.removeItem(selectedList, selectedItem)}}
                               ref={this.multiselectRefTracker}
                           />

                           <label htmlFor={"incident_type"} className={"takeover__incident-label"}>Incident Type</label>
                           <input type="text" name={"incident_type"} className={"takeover__incident"} placeholder={"Type"}/>
                            <div className="takeover__incident-checkboxes">
                                <div>
                                   <label htmlFor="fire">Fire</label>
                                   <input type="checkbox" id={"fire"} className={"takeover__is-fire"}/>
                                </div>
                                <div>
                                   <label htmlFor="ems">EMS</label>
                                   <input type="checkbox" id={"ems"} className={"takeover__is-ems"}/>
                                </div>
                            </div>
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
                    let dept = this.getDept(i.data.getDepartments());
                   return (
                   <div key={idx} className={"active-incidents__card"} id={'card-' + idx}>
                       <div className={"active-incidents__content"}>
                           <div className="active-incidents__details">
                               <div>{dept.map((str, idx) => <span key={idx}>{str}{(idx < dept.length-1) ? "," : "" } </span>)}</div>
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
