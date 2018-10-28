using Benifitinatoratronic.Models;
using Dapper;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace Benifitinatoratronic.Hubs
{
    public class MainHubDAO
    {
        public static HubResponse GetView(string path,object model)
        {
            try { return new HubSuccessResponse(RenderPartialToString(path, model)); }
            catch (Exception ex) { return new HubFailureResponse(ex.Message); }
        }
        public static HubResponse SavePerson(Person person)
        {
            try
            {
                var connestionString = ConfigurationManager.ConnectionStrings["default"].ConnectionString;
                using (var con = new SqlConnection(connestionString))
                {
                    var output = con.ExecuteScalar(@"
                        INSERT INTO [dbo].[People] (FirstName,LastName,Email,Phone,SSN,Address1,Address2,City,State,Zip,Parent,Type)
                        VALUES(@FirstName,@LastName,@Email,@Phone,@SSN,@Address1,@Address2,@City,@State,@Zip,@Parent,@Type)
                    ", new
                    {
                        FirstName = person.FirstName,
                        LastName = person.LastName,
                        Email = person.Email,
                        Phone = person.Phone,
                        SSN = person.SSN,
                        Address1 = person.Address1,
                        Address2 = person.Address2,
                        City = person.City,
                        State = person.State,
                        Zip = person.Zip,
                        Parent = person.Parent,
                        Type = person.Type,
                    });
                }
                return new HubSuccessResponse(person);
            }
            catch (Exception ex) { return new HubFailureResponse(ex.Message); }
        }
        public static HubResponse SearchForPerson(string searchTerm, string personType)
        {
            try
            {
                var connestionString = ConfigurationManager.ConnectionStrings["default"].ConnectionString;
                using (var con = new SqlConnection(connestionString))
                {
                    var output = con.Query<Person>(@"
                        SELECT top 50 * FROM [dbo].[People] 
                        WHERE (FirstName LIKE @search OR LastName LIKE @search OR Email LIKE @search OR Phone LIKE @search OR Zip LIKE @search) AND Parent " + (personType == "Employee" ? "" : "!") + @"= 0
                    ", new
                    {
                        search = $"%{searchTerm}%"
                    }).ToList();
                    return new HubSuccessResponse(output);
                }
            }
            catch (Exception ex) { return new HubFailureResponse(ex.Message); }
        }
        public static HubResponse SearchForPersonById(int personId)
        {
            try
            {
                var connestionString = ConfigurationManager.ConnectionStrings["default"].ConnectionString;
                using (var con = new SqlConnection(connestionString))
                {
                    var output = con.Query<Person>(@"
                        SELECT top 1 * FROM [dbo].[People] 
                        WHERE Id = @personId
                    ", new
                    {
                        personId
                    }).FirstOrDefault();
                    return new HubSuccessResponse(output);
                }
            }
            catch (Exception ex) { return new HubFailureResponse(ex.Message); }
        }
        public static HubResponse GetAllPeople(string type)
        {
            try
            {
                var connestionString = ConfigurationManager.ConnectionStrings["default"].ConnectionString;
                var people = new List<Person>();
                using (var con = new SqlConnection(connestionString))
                {
                    people = con.Query<Person>(@"
                        SELECT * FROM [dbo].[People] WHERE Parent " + (type == "Employee" ? "" : "!") + @"= 0
                    ").ToList();

                }
                return new HubSuccessResponse(people);
            }
            catch (Exception ex) { return new HubFailureResponse(ex.Message); }
        }
        public static HubResponse GetPersonDetails(int personId)
        {
            try
            {
                var connestionString = ConfigurationManager.ConnectionStrings["default"].ConnectionString;
                var people = new List<Person>();
                using (var con = new SqlConnection(connestionString))
                {
                    people = con.Query<Person>(@"
                        SELECT top 50 * FROM [dbo].[People] WHERE Id = @personId OR Parent = @personId
                    ", new
                    {
                        personId
                    }).ToList();
                    
                }
                return new HubSuccessResponse(new PersonDetails(people));
            }
            catch (Exception ex) { return new HubFailureResponse(ex.Message); }
        }
        //internals
        private static string RenderPartialToString(string filePath, object model)
        {
            HttpContext httpContext = MockContext.FakeHttpContext();

            var st = new StringWriter();
            var context = new HttpContextWrapper(httpContext);

            var routeData = new RouteData();
            var controllerContext = new ControllerContext(new RequestContext(context, routeData), new FakeController());
            var razor = new RazorView(controllerContext, filePath, null, false, null);
            razor.Render(
                new ViewContext(controllerContext, razor, new ViewDataDictionary(model), new TempDataDictionary(), st),
                st);
            return st.ToString();
        }
    }
}