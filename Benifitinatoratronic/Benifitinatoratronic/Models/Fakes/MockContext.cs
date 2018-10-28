using System.IO;
using System.Reflection;
using System.Web;
using System.Web.SessionState;

namespace Benifitinatoratronic.Models
{
    public class MockContext
    {
        #region Public Methods and Operators

        public static HttpContext FakeHttpContext()
        {
            var httpRequest = new HttpRequest(string.Empty, "http://novomatic/", string.Empty);
            var stringWriter = new StringWriter();
            var httpResponce = new HttpResponse(stringWriter);
            var httpContext = new HttpContext(httpRequest, httpResponce);

            var sessionContainer = new HttpSessionStateContainer(
                "id",
                new SessionStateItemCollection(),
                new HttpStaticObjectsCollection(),
                10,
                true,
                HttpCookieMode.AutoDetect,
                SessionStateMode.InProc,
                false);

            httpContext.Items["AspSession"] =
                typeof(HttpSessionState).GetConstructor(
                    BindingFlags.NonPublic | BindingFlags.Instance,
                    null,
                    CallingConventions.Standard,
                    new[] { typeof(HttpSessionStateContainer) },
                    null).Invoke(new object[] { sessionContainer });

            return httpContext;
        }

        #endregion
    }
}