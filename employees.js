const mysql = require("mysql");
const inquirer = require("inquirer");
const dotenv = require("dotenv");
dotenv.config();
const cTable = require("console.table");

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: process.env.user,
    password: process.env.pw,
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
                viewAllEmployees();
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
                // done
                addRole();
                break;
            case "Remove Role":
                removeRole();
                break;
            case "View all Departments":
                viewAllDepartments();
                break;
            case "Add Department":
                // done
                addDepartment();
                break;
            case "Remove Department":
                removeDepartment();
                break;
            case "Quit":
                connection.end();
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
let errorMessage;

// validation for roles and departments only
const validation = (input) => {
    upperAnswer(input);
    if (input === "") return "Please enter a valid answer";
    else if (previousData.includes(name)) return errorMessage;
    else return true;
};

const validationEmployee = (input) => {
    upperAnswer(input);
    if (input === "") return "Please enter a valid answer";
    else return true;
};
// *** END OF VALIDATION FUNCTIONS FOR PROMPTS ***


function viewAllEmployees() {
    const query = "SELECT employee.id, employee.first_name, employee.last_name, role.title, role.salary, ";
    query += "department.name FROM employee LEFT JOIN department, role ON (employee.role_id = role.id AND ";
    query += "role.department.id = department.id)";
    connection.query(query, function (err, res) {
        if (err) throw err;
        console.log("\n");
        console.table(res);
        prompt();
    })
}


function addEmp() {
    // collect previously saved employees to use as choices for manager
    let employees = ["None"];
    connection.query("SELECT first_name, last_name, id FROM employee", function (err, res) {
        if (err) throw err;
        res.forEach(employee => {
            let fullName = employee.first_name + " " + employee.last_name + " ID: " + employee.id;
            employees.push(fullName);
        });
        return employees;
    });

    // collect previously saved roles to use as choices
    let roles = [];
    connection.query("SELECT title FROM role", function (err, res) {
        if (err) throw err;
        res.forEach(role => {
            roles.push(role.title);
        });
        if (roles[0]) {
            promptEmp();
        }
        else {
            console.log('\x1b[41m%s\x1b[0m', "PLEASE NOTE: There are no roles yet; select a different option");
            prompt();
        }
    });

    const promptEmp = () => {
        inquirer.prompt([
            {
                type: "input",
                message: "What is the employee's first name?",
                name: "first_name",
                validate: validationEmployee
            },
            {
                type: "input",
                message: "What is the employee's last name?",
                name: "last_name",
                validate: validationEmployee
            },
            {
                type: "list",
                message: "What is the employee's role?",
                name: "role",
                choices: roles
            },
            {
                type: "list",
                message: "Who is the employee's manager?",
                name: "manager",
                choices: employees
            }
        ]).then(function (res) {
            console.log(res);
            let firstName = upperAnswer(res.first_name);
            let lastName = upperAnswer(res.last_name);

            let roleID;
            let managerID;

            connection.query("SELECT id FROM role where title=?", [res.role], function (err, res) {
                if (err) throw err;
                roleID = res[0].id;
                console.log("running 1")
                findManagerID();
                return roleID;
            })

            const findManagerID = () => {

                if (res.manager === "None") managerID = null;
                // else {
                    //     let index = res.manager.indexOf("ID:") + 4;
                    //     managerID = res.manager.slice(index);
                    //     console.log("running 2")
                    //     return managerID;
                    // };
                    else {
                        console.log("running 2");
                        let managerInfo = res.manager.split(" ");
                        let firstName = managerInfo[0];
                        let lastName = managerInfo[1];
                        connection.query("SELECT id FROM employee WHERE (first_name=? AND last_name=?)", [firstName, lastName], function (err, res) {
                                if (err) throw err;
                                managerID = res[0].id;
                                return managerID;
                            });
                        }
                    }

            const insertEmp = () => {
                console.log("running 3");
                // console.log(managerID);
                console.log(roleID);
                connection.query(`INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ("${firstName}", "${lastName}", ${roleID}, ${managerID})`, function (err) {

                // connection.query(`INSERT INTO employee (first_name, last_name, role_id) VALUES ("${firstName}", "${lastName}", ${roleID})`, function (err) {
                    if (err) throw err;
                    console.log(`${firstName} ${lastName} has been successfully entered.`);
                })
            }
            // ******* CHANGE THIS SETTIMEOUT WITH ASYNC AWAIT *******
            setTimeout(insertEmp, 10);
            prompt();
        });
    }
}

function viewAllRoles() {
    connection.query("SELECT role.id, role.title, role.salary, department.name FROM role LEFT JOIN department ON role.department_id=department.id", function (err, res) {
        if (err) throw err;
        console.log("\n");
        console.table(res);
        prompt();
    })
}


function addRole() {
    // collect previously saved department to use as choices
    let departments = [];
    connection.query("SELECT name FROM department", function (err, res) {
        if (err) throw err;
        res.forEach(dept => {
            departments.push(dept.name);
        });
        if (departments[0]) {
            promptRole();
        }
        else {
            console.log('\x1b[41m%s\x1b[0m', "PLEASE NOTE: There are no departments yet; select a different option");
            prompt();
        }
    });
    // collect previously entered roles to avoid duplicates (validation)
    connection.query("SELECT title FROM role", function (err, res) {
        if (err) throw err;
        previousData = [];
        res.forEach(role => {
            previousData.push(role.title);
        });
    });
    // error message for validation process
    errorMessage = "You have already entered this role; please enter a different one."

    const promptRole = () => {
        inquirer.prompt([
            {
                type: "input",
                message: "What is the name of the role?",
                name: "role",
                validate: validation
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
            let salary = res.salary;
            let department = res.department;

            // get the id from the department selected
            connection.query("SELECT id FROM department WHERE name=?", [department], function (err, res) {
                if (err) throw err;
                // save role information to server
                connection.query(`INSERT INTO role (title, salary, department_id) VALUES ("${name}", ${salary}, ${res[0].id})`, function (err) {
                    if (err) throw err;
                    console.log('\x1b[32m%s\x1b[0m', `${name} has been successfully added.`)
                });
            })
            prompt();
        });
    };
}

function viewAllDepartments() {
    connection.query("SELECT * FROM department", function (err, res) {
        if (err) throw err;
        console.log("\n");
        console.table(res);
        prompt();
    })
}

function addDepartment() {
    // collect previously entered departments to avoid duplicates (validation)
    connection.query("SELECT name FROM department", function (err, res) {
        if (err) throw err;
        previousData = [];
        res.forEach(dept => {
            previousData.push(dept.name);
        });
    });
    // error message for validation process
    errorMessage = "You have already entered this department; please enter a different one."

    inquirer.prompt([
        {
            type: "input",
            message: "What is the name of the department?",
            name: "department",
            validate: validation
        }
    ]).then(function (res) {
        connection.query(`INSERT INTO department (name) VALUES ("${name}")`, function (err) {
            if (err) throw err;
            console.log('\x1b[32m%s\x1b[0m', `${name} has been succesfully added.`)
        });
        prompt();
    });
};


// Re move:
// which one doe you want to remove (and the list of the XX appears below

//     removing role also removes employees
//     dept: this will also remove associated roles and emplouyees)
