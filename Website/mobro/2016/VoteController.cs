using System.IO;
using System.Net;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;

namespace Website.mobro._2016
{
    [RoutePrefix("api/mobro/2016")]
    [CookieAuthentication]
    public class VoteController : ApiController
    {
        [HttpPost]
        [Route("vote")]
        public async Task<IHttpActionResult> PostAsync([FromBody]string vote)
        {
            var connectionString = File.ReadAllText(HttpContext.Current.Server.MapPath("~/App_Data/azurestorage.secret"));
            var store = new VotesStore(connectionString);

            var added = await store.AddVoteAsync(this.User.Identity.Name, vote);

            if (added)
            {
                return this.StatusCode(HttpStatusCode.NoContent);
            }

            return this.NotFound();
        }
    }
}
