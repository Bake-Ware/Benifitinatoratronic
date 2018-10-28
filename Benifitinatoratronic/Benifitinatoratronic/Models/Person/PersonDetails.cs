using System.Collections.Generic;
using System.Linq;

namespace Benifitinatoratronic.Models
{
    public class PersonDetails
    {
        public List<Person> People { get; set; }
        public decimal Income => 2000; //immaginary data source ~SPOOKY~
        public decimal Discount => Employee.FirstName.ToLower().StartsWith("a") ? 0.9M : 1;
        public List<Person> Dependants => People.Where(x => x.Parent != 0).ToList();
        public Person Employee => People.Where(x => x.Parent == 0).FirstOrDefault();
        public decimal Benefits => ((Employee != null ? 1000M : 0) + (Dependants.Count() * 500M))/26;
        public decimal Deductions => Benefits * Discount;
        public PersonDetails(List<Person> people)
        {
            People = people;
        }
    }
}