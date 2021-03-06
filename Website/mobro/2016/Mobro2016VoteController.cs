﻿using System.Net;
using System.Threading.Tasks;
using System.Web.Http;

namespace Website.mobro._2016
{
    [RoutePrefix("mobro/2016/api")]
    [CookieAuthentication]
    public class Mobro2016VoteController : ApiController
    {
        [HttpPost]
        [Route("vote")]
        public async Task<IHttpActionResult> PostAsync([FromBody]string vote)
        {
            var store = new VotesStore();
            var added = await store.AddVoteAsync(this.User.Identity.Name, vote).ConfigureAwait(false);

            if (added)
            {
                return this.StatusCode(HttpStatusCode.NoContent);
            }

            return this.NotFound();
        }
    }
}
