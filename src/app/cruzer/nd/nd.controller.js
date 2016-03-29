(function() {
    angular.module('altairApp')
        .controller('ndCleanDbCtrl', ndCleanDb);
        
    ndCleanDb.$inject = ['$pouchDBUser', '$pouchDBDefault'];
    
    function ndCleanDb($pouchDBUser, $pouchDBDefault) {
        var vm = this;
        vm.message = "Clean Database ?";
        vm.doIt = doIt;
        
        function doIt() {
            $pouchDBUser.getAll().then(function(res) {
                $pouchDBUser.delete(res.rows[0].doc._id, res.rows[0].doc._rev);
            });
            $pouchDBDefault.getAll().then(function(res) {
                $pouchDBDefault.delete(res.rows[0].doc._id, res.rows[0].doc._rev);
            });
        }
    }
})();