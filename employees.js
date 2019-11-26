const mysql = require("mysql");
const inquirer = require("inquirer");

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "mysql2014",
    database: "employeesDB"
});

connection.connect(function (err) {
    if (err) throw err;
    console.log(`connected as id ${connection.threadId}`);
    prompt();
});

function prompt() {
    inquirer.prompt([
        {
            type: "list",
            message: "What would you like to do?",
            name: "todo",
            choices: [
                "View all Employees",
                "View all Employees by Department",
                "View all Employees by Manager",
                "Add Employee",
                "Remove Employee",
                "Update Employee Role",
                "Update Employee Manager",
                "View all Roles",
                "Add Role",
                "Remove Role",
                "View all Departments",
                "Add Department",
                "Remove Department",
                "Quit"
            ]
        }
    ]).then(function (res) {
        switch (res.todo) {
            case "View all Employees":
                viewAll();
                break;
            case "View all Employees by Department":
                viewAllByDept();
                break;
            case "View all Employees by Manager":
                viewAllByMgr();
                break;
            case "Add Employee":
                addEmp();
                break;
            case "Remove Employee":
                removeEmp();
                break;
            case "Update Employee Role":
                updateRole();
                break;
            case "Update Employee Manager":
                updateMgr();
                break;
            case "View all Roles":
                viewAllRoles();
                break;
            case "Add Role":
                addRole();
                break;
            case "Remove Role":
                removeRole();
                break;
            case "View all Departments":
                viewAllDepartments();
                break;
            case "Add Department":
                // done although could fix the issue with the warning & prompt
                addDepartment();
                break;
            case "Remove Department":
                removeDepartment();
                break;
            case "Quit":
                quitPrompt();
                break;
        }

    })
};


// *** FORMAT ANSWERS FROM PROMPTS ***
let name;
// capitalize first letter of answers from prompt
function upperAnswer(answer) {
    let splitAnswer = answer.trim().toLowerCase().split(" ")
    let answerUpperCase = "";
    splitAnswer.forEach(word => {
        answerUpperCase += word.charAt(0).toUpperCase() + word.slice(1) + " ";
        answerUpperCase.trim();
    });
    name = answerUpperCase.trim();
    return name;
};



// *** VALIDATION FUNCTIONS FOR PROMPTS ***

let previousData;

const roleValidation = (input) => {
    upperAnswer(input);
    
    if (input === "") {
        return "Please enter a valid answer";
    }
    else if (previousData.includes(name)) {
        return "You have already entered this role; please enter a different one.";
    }
    else {
        return true;
    }
};


// finish this
function addEmp() {
    inquirer.prompt([
        {
            type: "input",
            message: "What is the employee's first name?",
            name: "first_name"
        },
        {
            type: "input",
            message: "What is the employee's last name?",
            name: "last_name"
        },
        {
            type: "list",
            message: "What is the employee's role?"
        }
    ])
}




function addRole() {
    let departments = [];
    connection.query("SELECT name FROM department", function (err, res) {
        if (err) throw err;
        res.forEach(dept => {
            departments.push(dept.name);
        });
    });
    connection.query("SELECT title FROM role", function (err, res) {
        if (err) throw err;
        previousData = [];
        res.forEach(role => {
            previousData.push(role.title);
        });
    });
    inquirer.prompt([
        {
            type: "input",
            message: "What is the name of the role?",
            name: "role",
            validate: roleValidation
            // verification of duplicates needs to go here not below!!! similar to email address homeworlk
        },
        {
            type: "input",
            message: "What is the salary for the role?",
            name: "salary"
        },
        {
            type: "list",
            message: "Which department does this role belong to?",
            name: "department",
            choices: departments
        }
    ]).then(function (res) {
        console.log(res)
        let salary = res.salary;
        let department = res.department;

        // // convert role to upper case every first letter of words
        // let role = res.role.trim().toLowerCase().split(" ")
        // let roleUpper = "";
        // role.forEach(word => {
        //     roleUpper += word.charAt(0).toUpperCase() + word.slice(1) + " ";
        //     roleUpper.trim();
        // });
        // let name = roleUpper.trim();

        // compare entered value against previous entries
        let previousRoles = [];
        connection.query("SELECT title FROM role", function (err, res) {
            if (err) throw err;
            res.forEach(role => {
                previousRoles.push(role.title);
            });

            if (previousRoles.includes(name)) {
                console.log("WARNING! You have already entered this role. Please select a different action.");
            }
            else {
                // get the id from the department selected
                connection.query("SELECT id FROM department WHERE name=?", [department], function (err, res) {
                    if (err) throw err;
                    // insert role information
                    connection.query(`INSERT INTO role (title, salary, department_id) VALUES ("${name}", ${salary}, ${res[0].id})`, function (err) {
                        if (err) throw err;
                        console.log("Role has been successfully added.")
                    });
                })
            }
        });
        prompt();
    });
}


// *** ADD A DEPARTMENT ***
function addDepartment() {
    inquirer.prompt([
        {
            type: "input",
            message: "What is the name of the department?",
            name: "department"
        }
    ]).then(function (res) {
        // convert department to upper case every first letter of words
        let dept = res.department.trim().toLowerCase().split(" ")
        let deptUpper = "";
        dept.forEach(word => {
            deptUpper += word.charAt(0).toUpperCase() + word.slice(1) + " ";
            deptUpper.trim();
        });
        let deptName = deptUpper.trim();

        // compare entered value against previous entries
        let previousDepts = [];
        connection.query("SELECT name FROM department", function (err, res) {
            if (err) throw err;
            res.forEach(dept => {
                previousDepts.push(dept.name);
            });

            if (previousDepts.includes(deptName)) {
                console.log("WARNING! You have already entered this department. Please select a different action.");
            }
            else {
                connection.query(`INSERT INTO department (name) VALUES ("${deptName}")`, function (err) {
                    if (err) throw err;
                    console.log("Deparment has been succesfully added.")
                });
            }
        });
        prompt();
    });
};


// Re move:
// which one doe you want to remove (and the list of the XX appears below

//     removing role also removes employees
//     dept: this will also remove associated roles and emplouyees)
