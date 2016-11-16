using System.Dynamic;
using System.IO;
using System.Net;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using Newtonsoft.Json.Linq;

namespace Website.mobro._2016
{
    [CookieAuthentication]
    [RoutePrefix("api/mobro/2016")]
    public class VotesController : ApiController
    {
        [HttpDelete]
        [Route("votes")]
        public async Task<IHttpActionResult> DeleteAsync()
        {
            var connectionString = File.ReadAllText(HttpContext.Current.Server.MapPath("~/App_Data/azurestorage.secret"));
            var store = new VotesStore(connectionString);

            await store.ResetAsync();

            return this.StatusCode(HttpStatusCode.NoContent);
        }

        [HttpGet]
        [Route("votes")]
        public IHttpActionResult Get()
        {
            var connectionString = File.ReadAllText(HttpContext.Current.Server.MapPath("~/App_Data/azurestorage.secret"));
            var store = new VotesStore(connectionString);

            var result = new JObject();

            foreach(var pair in store.GetVoteCountByCategory())
            {
                var item = result[pair.Key] = new JObject();
                item["votes"] = new JValue(pair.Value);
                item["uri"] = "img/" + pair.Key + ".png";
            }

            return this.Ok(result);
        }
    }
}
