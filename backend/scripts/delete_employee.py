from app.core.database import SessionLocal, engine
from app.models.models import Employee, Base
import sys

def delete_employee(emp_id):
    db = SessionLocal()
    try:
        employee = db.query(Employee).filter(Employee.id == emp_id).first()
        if not employee:
            print(f"Error: Employee with ID {emp_id} not found.")
            return
        
        print(f"Deleting Employee: {employee.name} (Designation: {employee.designation})")
        confirmation = input("Are you sure? (y/n): ")
        if confirmation.lower() == 'y':
            db.delete(employee)
            db.commit()
            print("Employee deleted successfully.")
        else:
            print("Operation cancelled.")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        try:
            emp_id = int(sys.argv[1])
            delete_employee(emp_id)
        except ValueError:
            print("Please provide a valid numeric Employee ID.")
    else:
        print("Usage: python delete_employee.py <employee_id>")
        # Interactive mode fallback
        try:
            eid = input("Enter Employee ID to delete: ")
            delete_employee(int(eid))
        except ValueError:
             print("Invalid ID.")
