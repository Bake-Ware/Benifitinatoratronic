using Benifitinatoratronic.Models;
using Microsoft.AspNet.SignalR;

namespace Benifitinatoratronic.Hubs
{
    public class MainHub : Hub
    {
        /// <summary>
        /// Hi everybody that's not me
        /// </summary>
        /// <param name="name">String username of person logging in</param>
        public HubResponse Hello(string name) { 
            Clients.AllExcept(Context.ConnectionId).hiEverybody(name);
            return new HubSuccessResponse(Context.ConnectionId);
        }
        public HubResponse GetView(string path, object model) => Invoker(MainHubDAO.GetView(path, model), "GetViewResponse");
        public HubResponse SavePerson(Person person) => Invoker(MainHubDAO.SavePerson(person), "SavePersonResponse");
        public HubResponse SearchForPerson(string searchTerm,string personType) => Invoker(MainHubDAO.SearchForPerson(searchTerm, personType), "SearchForPersonResponse");
        public HubResponse SearchForPersonById(int personId) => Invoker(MainHubDAO.SearchForPersonById(personId), "SearchForPersonByIdResponse");
        public HubResponse GetAllPeople(string type) => Invoker(MainHubDAO.GetAllPeople(type), "GetAllPeopleResponse");
        public HubResponse GetPersonDetails(int personId) => Invoker(MainHubDAO.GetPersonDetails(personId), "GetPersonDetailsResponse");
        private T Invoker<T>(T res, string cbName, dynamic hub = null) { (hub ?? Clients.Caller).Invoke(cbName, res); return res; }
    }
}