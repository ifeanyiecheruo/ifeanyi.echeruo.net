using System.IO;
using System.Net;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using Newtonsoft.Json.Linq;

namespace Website.mobro._2017
{
    [RoutePrefix("mobro/2017/api")]
    [CookieAuthentication]
    public class Mobro2017VotesController : ApiController
    {
        [HttpDelete]
        [Route("votes")]
        public async Task<IHttpActionResult> DeleteAsync()
        {
            var store = new VotesStore();

            await store.ResetAsync().ConfigureAwait(false);

            return this.StatusCode(HttpStatusCode.NoContent);
        }

        [HttpGet]
        [Route("votes")]
        public async Task<IHttpActionResult> GetAsync()
        {
            var store = new VotesStore();

            var result = new JObject();

            foreach(var pair in await store.GetVoteCountByCategoryAsync().ConfigureAwait(false))
            {
                var item = result[pair.Key] = new JObject();
                item["votes"] = new JValue(pair.Value);
                item["uri"] = "img/" + pair.Key + ".png";
            }

            return this.Ok(result);
        }
    }
}
