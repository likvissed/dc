class CreateContacts < ActiveRecord::Migration
  def change
    create_table :contacts do |t|
      t.integer     :tn
      t.string      :info,        index: true
      t.integer     :dept,        index: true
      t.references  :department_head
      t.string      :work_num,    limit: 10
      t.string      :mobile_num,  limit: 20
      t.boolean     :manually,    default: false
      t.timestamps null: false
    end
  end
end
