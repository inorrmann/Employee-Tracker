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
                // missing manager full name
                viewAllEmployees();
                break;
            case "View all Employees by Department":
                viewAllByDept();
                break;
            case "View all Employees by Manager":
                // *** DONE ***
                viewAllByMgr();
                break;
            case "Add Employee":
                // *** DONE ***
                addEmp();
                break;
            case "Remove Employee":
                removeEmp();
                break;
            case "Update Employee Role":
                // *** DONE ***
                updateRole();
                break;
            case "Update Employee Manager":
                // *** DONE ***
                updateMgr();
                break;
            case "View all Roles":
                // *** DONE ***
                viewAllRoles();
                break;
            case "Add Role":
                // *** DONE ***
                addRole();
                break;
            case "Remove Role":
                removeRole();
                break;
            case "View all Departments":
                // *** DONE ***
                viewAllDepartments();
                break;
            case "Add Department":
                // *** DONE ***
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

// 
// ***** FORMAT ANSWERS FROM PROMPTS *****
// 
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


// 
// ***** VALIDATION FUNCTIONS FOR PROMPTS *****
// 
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
// ***** END *****


function viewAllEmployees() {
    let query = "SELECT employee.id, employee.first_name, employee.last_name, ";
    query += "role.title, department.name AS department, role.salary, ";
    query += "manager_ID AS manager FROM employee LEFT JOIN (department, role) ";
    query += "ON (employee.role_id = role.id AND role.department_id = department.id)";
    // let query = "SELECT CONCAT(A.first_name, ' ', A.last_name) manager FROM employee A, employee B WHERE B.manager_id = A.id";
    connection.query(query, function (err, res) {
        if (err) throw err;
        console.log("\n");
        console.table(res);
        prompt();
    })
}


function viewAllByDept() {
    let departments = [];
    connection.query("SELECT * FROM department", function (err, res) {
        if (err) throw err;
        res.forEach(department => {
            departments.push(department.name);
            return departments;
        })
    })
    const viewDeptPrompt = () => {
        inquirer.prompt([
            {
                type: "list",
                message: "Select a department",
                name: "dept",
                choices: departments
            }
        ]).then(function (res) {
            console.log(res);
            let department = res.dept;
            connection.query("SELECT id FROM department WHERE name=?", [res.dept], function (err, res) {
                if (err) throw err;
                let query = `SELECT employee.id, employee.first_name, employee.last_name, `;
                query += `role.title, role.salary, manager_id AS manager `;
                query += `FROM employee LEFT JOIN (department, role) `;
                query += `ON (employee.role_id = role.id AND role.department_id = department.id) `;
                query += `WHERE department.id =  ${res[0].id}`
                connection.query(query, function (err, res) {
                    if (err) throw err;
                    console.log(`\n Department: ${department} \n`);
                    console.table(res);
                })
            });
            prompt();
        });
    }
    setTimeout(viewDeptPrompt, 50);
}


function viewAllByMgr() {
    let managers = [];
    let query = "SELECT A.first_name, A.last_name, A.id FROM employee A, employee B WHERE B.manager_id = A.id ORDER by A.id";
    connection.query(query, function (err, res) {
        if (err) throw err;
        res.forEach(manager => {
            let fullName = `${manager.first_name} ${manager.last_name} ID: ${manager.id}`;
            managers.push(fullName);
            return managers;
        });
    })
    const viewMgrPrompt = () => {
        inquirer.prompt([
            {
                type: "list",
                message: "Select a manager",
                name: "manager",
                choices: managers
            }
        ]).then(function (res) {
            let parsedMgr = res.manager.split(" ")
            let query1 = `SELECT employee.id, employee.first_name, employee.last_name, `;
            query1 += `role.title, department.name AS department, role.salary `;
            query1 += `FROM employee LEFT JOIN (department, role) `;
            query1 += `ON (employee.role_id = role.id AND role.department_id = department.id) `;
            query1 += `WHERE manager_id =  ${parsedMgr[3]}`
            connection.query(query1, function (err, res) {
                if (err) throw err;
                console.log(`\n Manager: ${parsedMgr[0]} ${parsedMgr[1]} \n\n Employees: \n`);
                console.table(res);
            })
            prompt();
        });
    }
    setTimeout(viewMgrPrompt, 50);
}


// 
// ***** FIND PREVIOUSLY STORED EMPLOYEES & ROLES *****
// 
let employees;
const findSavedEmployees = () => {
    connection.query("SELECT first_name, last_name, id FROM employee", function (err, res) {
        if (err) throw err;
        res.forEach(employee => {
            let fullName = `${employee.first_name} ${employee.last_name} ID: ${employee.id}`;
            employees.push(fullName);
        });
        return employees;
    });
}

let roles;
const findSavedRoles = () => {
    connection.query("SELECT title FROM role", function (err, res) {
        if (err) throw err;
        res.forEach(role => {
            roles.push(role.title);
        });
        if (!roles[0]) {
            console.log('\x1b[41m%s\x1b[0m', "PLEASE NOTE: There are no roles yet; select a different option");
            prompt();
        }
        return roles;
    });
}
// ***** END *****


function addEmp() {
    employees = ["None"];
    findSavedEmployees();
    roles = [];
    findSavedRoles();

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
            let firstName = upperAnswer(res.first_name);
            let lastName = upperAnswer(res.last_name);
            // get role id for selected position
            let roleID;
            connection.query("SELECT id FROM role where title=?", [res.role], function (err, res) {
                if (err) throw err;
                roleID = res[0].id;
                findManagerID(roleID);
            })
            // get employee id for selected manager
            let managerID;
            const findManagerID = (roleID) => {
                if (res.manager === "None") {
                    managerID = null;
                    insertEmp(roleID, managerID);
                }
                else {
                    // parse manager response to extract manager's first and last name
                    let managerInfo = res.manager.split(" ");
                    let firstName = managerInfo[0];
                    let lastName = managerInfo[1];
                    connection.query("SELECT id FROM employee WHERE (first_name=? AND last_name=?)", [firstName, lastName], function (err, res) {
                        if (err) throw err;
                        managerID = res[0].id;
                        insertEmp(roleID, managerID);
                    });
                }
            }

            const insertEmp = (roleID, managerID) => {
                connection.query(`INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ("${firstName}", "${lastName}", ${roleID}, ${managerID})`, function (err) {
                    if (err) throw err;
                    console.log('\x1b[32m%s\x1b[0m', `${firstName} ${lastName} has been successfully entered.`);
                })
            }
            prompt();
        });
    }
    setTimeout(promptEmp, 100);
}


function removeEmp() {

}


function updateRole() {
    employees = [];
    findSavedEmployees();
    roles = [];
    findSavedRoles();

    const promptUpdateRole = () => {
        inquirer.prompt([
            {
                type: "list",
                message: "Please select an employee.",
                name: "employee",
                choices: employees
            },
            {
                type: "list",
                message: "Select a new role",
                name: "newRole",
                choices: roles
            }
        ]).then(function (res) {
            console.log(res);
            let parsedName = res.employee.split(" ")
            console.log(parsedName);
            connection.query("SELECT id FROM role WHERE title=?", [res.newRole], function (err, res) {
                if (err) throw err;
                console.log(res);
                connection.query(`UPDATE employee SET role_id=${res[0].id} WHERE id=${parsedName[3]}`, function (err) {
                    if (err) throw err;
                    console.log('\x1b[32m%s\x1b[0m', `${parsedName[0]} ${parsedName[1]}'s role has been successfully updated.`);
                })

            })
        })
    }
    setTimeout(promptUpdateRole, 100);
}


function updateMgr() {
    employees = [];
    findSavedEmployees();

    const promptUpdateMgr = () => {
        inquirer.prompt([
            {
                type: "list",
                message: "Please select an employee.",
                name: "employee",
                choices: employees
            }
        ]).then(function (res) {
            console.log(res);
            let index = employees.indexOf(res.employee)
            let parsedEmp = res.employee.split(" ")
            employees.splice(index, 1);
            inquirer.prompt([
                {
                    type: "list",
                    message: "Select a new manager",
                    name: "newMgr",
                    choices: employees
                }
            ]).then(function (res) {
                let mgrId = res.newMgr.split(" ")[3]
                connection.query(`UPDATE employee SET manager_id=${mgrId} WHERE id=${parsedEmp[3]}`, function (err) {
                    if (err) throw err;
                    console.log('\x1b[32m%s\x1b[0m', `${parsedEmp[0]} ${parsedEmp[1]}'s manager has been successfully updated.`);
                })
            })
        })
    }
    setTimeout(promptUpdateMgr, 50);
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


function removeRole() {

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


function removeDepartment() {


}

// Re move:
// which one doe you want to remove (and the list of the XX appears below

//     removing role also removes employees
//     dept: this will also remove associated roles and emplouyees)
